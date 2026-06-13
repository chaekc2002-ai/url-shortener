"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";

interface UrlData {
  id: string; // The short URL id
  originalUrl: string;
  createdAt: any;
}

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // 화면에 보여질 기본 도메인을 설정합니다.
    setBaseUrl("https://ttori0912.edu");
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const q = query(collection(db, "urls"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedUrls: UrlData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUrls.push({ id: doc.id, ...doc.data() } as UrlData);
      });
      setUrls(fetchedUrls);
    } catch (error) {
      console.error("Error fetching URLs: ", error);
    }
  };

  const generateRandomString = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) {
      alert("원본 URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 1. Determine the short ID
      let shortId = customAlias.trim();
      
      if (!shortId) {
        // Generate random 6 character string if no custom alias is provided
        shortId = generateRandomString(6);
      }

      // Check if shortId already exists
      const docRef = doc(db, "urls", shortId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("이미 사용 중인 단축 주소입니다. 다른 주소를 입력해주세요.");
        setLoading(false);
        return;
      }

      // Ensure original URL has http:// or https://
      let formattedUrl = originalUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }

      // 2. Save to Firestore
      await setDoc(docRef, {
        originalUrl: formattedUrl,
        createdAt: serverTimestamp()
      });

      // 3. Clear form and refresh list
      setOriginalUrl("");
      setCustomAlias("");
      fetchUrls();

    } catch (error) {
      console.error("Error creating short URL:", error);
      alert("URL 생성 중 오류가 발생했습니다. 환경 변수 설정을 확인해주세요.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("정말로 이 단축 URL을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "urls", id));
        fetchUrls();
      } catch (error) {
        console.error("Error deleting URL:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <main>
      <h1>URL 단축기</h1>
      <p className="subtitle">길고 복잡한 주소를 짧고 예쁘게 만드세요</p>

      <div className="container">
        {/* Create URL Form */}
        <div className="clay-card animate-fade-in">
          <form onSubmit={handleShorten}>
            <div className="form-group">
              <label>원본 주소 (Original URL)</label>
              <input
                type="text"
                className="clay-input"
                placeholder="https://example.com/very/long/url..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>커스텀 주소 (선택사항, 한글 가능)</label>
              <div className="input-group">
                <span className="prefix">{baseUrl}/</span>
                <input
                  type="text"
                  className="clay-input"
                  placeholder="원하는 주소 입력 (예: 이벤트, event1)"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="clay-btn" disabled={loading}>
              {loading ? <span className="loading-spinner"></span> : "URL 단축하기"}
            </button>
          </form>
        </div>

        {/* URLs List */}
        <div className="url-list">
          <h2 style={{ paddingLeft: '1rem' }}>내 단축 주소 목록</h2>
          {urls.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096' }}>생성된 단축 주소가 없습니다.</p>
          ) : (
            urls.map((url) => (
              <div key={url.id} className="clay-list-item animate-fade-in">
                <div className="urls">
                  <span className="original-url" title={url.originalUrl}>
                    {url.originalUrl}
                  </span>
                  <div className="short-url-container">
                    <a
                      href={`${baseUrl}/${encodeURIComponent(url.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="short-url"
                    >
                      {baseUrl}/{url.id}
                    </a>
                  </div>
                </div>
                <button
                  className="clay-btn danger small-btn"
                  onClick={() => handleDelete(url.id)}
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
