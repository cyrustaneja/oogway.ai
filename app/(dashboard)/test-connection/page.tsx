"use client";
import { useState, useEffect } from "react";

export default function TestConnectionPage() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const apis = [
      { name: "Experts", url: "/api/experts" },
      { name: "Courses", url: "/api/courses" },
      { name: "Trash", url: "/api/trash" },
      { name: "Auth Session", url: "/api/auth/session" }
    ];

    Promise.all(apis.map(api => 
      fetch(api.url).then(r => r.json().then(data => ({ name: api.name, status: r.status, data })))
      .catch(err => ({ name: api.name, status: "ERROR", data: err.message }))
    )).then(setResults);
  }, []);

  return (
    <div className="p-10 text-white space-y-4">
      <h1 className="text-xl font-bold">API Diagnostic</h1>
      <div className="space-y-2">
        {results.map(r => (
          <div key={r.name} className="p-4 bg-slate-800 rounded-lg">
            <p className="font-bold">{r.name}: Status {r.status}</p>
            <pre className="text-xs text-slate-400 mt-2">{JSON.stringify(r.data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
