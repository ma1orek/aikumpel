import React, { useEffect, useState } from 'react';

const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dni od teraz

function getTimeLeft() {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const min = Math.floor((diff / (1000 * 60)) % 60);
  const sec = Math.floor((diff / 1000) % 60);
  return { day, hour, min, sec };
}

export default function Home() {
  const [time, setTime] = useState(getTimeLeft());
  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center bg-black text-light position-relative" style={{fontFamily: 'sans-serif'}}>
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{zIndex:0, pointerEvents:'none'}}>
        {/* Siatka i podział */}
        <div style={{position:'absolute',top:0,left:'50%',width:2,height:'100%',background:'#fff2',zIndex:1}}></div>
        <div style={{position:'absolute',top:'50%',left:0,height:2,width:'100%',background:'#fff2',zIndex:1}}></div>
      </div>
      <div className="row w-100" style={{zIndex:2, maxWidth:1200, border:'2px solid #fff2', background:'rgba(0,0,0,0.7)'}}>
        <div className="col-md-7 p-5 d-flex flex-column justify-content-between">
          <div>
            <div className="text-uppercase" style={{letterSpacing:'0.1em',fontSize:18,opacity:0.7}}>kamikoto/神事</div>
            <h1 className="display-1 fw-bold" style={{fontSize:'5rem',lineHeight:1.1}}>新年セール</h1>
            <div className="mb-4" style={{opacity:0.7}}>(New Year Sales)</div>
            <div className="d-flex align-items-end mb-2" style={{fontSize:'2.5rem',fontWeight:700}}>
              {String(time.day).padStart(2,'0')} : {String(time.hour).padStart(2,'0')} : {String(time.min).padStart(2,'0')} : {String(time.sec).padStart(2,'0')}
            </div>
            <div className="d-flex mb-4" style={{gap:32}}>
              <div>Day<br/><span style={{fontSize:12,opacity:0.7}}>(日)</span></div>
              <div>Hour<br/><span style={{fontSize:12,opacity:0.7}}>(時間)</span></div>
              <div>Min<br/><span style={{fontSize:12,opacity:0.7}}>(分)</span></div>
              <div>Sec<br/><span style={{fontSize:12,opacity:0.7}}>(秒)</span></div>
            </div>
            <div className="fw-bold">Free Shipping <span className="ms-2" style={{fontWeight:400,opacity:0.7}}>(送料無料)</span></div>
            <div className="mt-3 mb-2">Special offers while stock lasts</div>
            <div style={{fontSize:12,opacity:0.7}}>(在庫がなくなり次第終了とさせていただきます)</div>
          </div>
        </div>
        <div className="col-md-5 d-flex flex-column justify-content-between align-items-center p-5 position-relative">
          <div className="w-100 d-flex justify-content-end align-items-start">
            <div className="text-end" style={{fontSize:18,opacity:0.7}}>
              <a href="#" className="text-light text-decoration-none me-4">Store</a>
              <a href="#" className="text-light text-decoration-none me-4">About Kamikoto</a>
              <a href="#" className="text-light text-decoration-none me-4">Choise of Chefs</a>
              <a href="#" className="text-light text-decoration-none"><i className="bi bi-cart"></i> Cart</a>
            </div>
          </div>
          <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            {/* Placeholder na obrazek noża */}
            <img src="https://pngimg.com/d/knife_PNG1066.png" alt="Knife" style={{maxWidth:'80%',maxHeight:300,filter:'grayscale(1) drop-shadow(0 4px 32px #0008)'}} />
          </div>
          <div className="text-end w-100" style={{fontSize:14,opacity:0.7}}>
            Scroll Down
          </div>
        </div>
      </div>
    </div>
  );
}