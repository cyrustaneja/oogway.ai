import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const emailClean = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: emailClean },
        });

        if (!user || !user.passwordHash) {
          throw new Error("No user found with this email");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const emailClean = user.email.toLowerCase().trim();

        // Verify if the email is pre-registered in the database roster
        const dbUser = await prisma.user.findUnique({
          where: { email: emailClean },
        });

        if (!dbUser) {
          // Reject login if email is not pre-added by Admin
          return "/login?error=AccessDenied";
        }

        // Attach existing DB role & ID to user object for JWT callback
        (user as any).role = dbUser.role;
        (user as any).id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }

      if (token?.email) {
        const emailClean = token.email.toLowerCase().trim();
        const dbUser = await prisma.user.findUnique({
          where: { email: emailClean },
          select: { id: true, role: true, name: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          if (dbUser.name) token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role || "EXPERT";
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
