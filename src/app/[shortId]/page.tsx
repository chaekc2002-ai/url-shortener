"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RedirectPage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortId) return;
      try {
        const decodedId = decodeURIComponent(shortId);
        const docRef = doc(db, "urls", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          window.location.href = data.originalUrl;
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching URL:", error);
        setError(true);
      }
    };
    fetchAndRedirect();
  }, [shortId]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "'Outfit', sans-serif", backgroundColor: "#eef2f6", color: "#2d3748" }}>
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>존재하지 않는 단축 URL입니다.</p>
        <a href="/" style={{ padding: "1rem 2rem", backgroundColor: "#7b9fed", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: "bold", boxShadow: "8px 8px 16px rgba(166, 180, 200, 0.4), inset -5px -5px 15px rgba(166, 180, 200, 0.2), inset 5px 5px 15px rgba(255, 255, 255, 1)" }}>
          메인으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#eef2f6" }}>
      <div className="loading-spinner" style={{ width: "3rem", height: "3rem", borderColor: "#7b9fed", borderTopColor: "transparent", borderWidth: "4px" }}></div>
    </div>
  );
}
