import React from "react";
import banner from "../assets/ElectionBannerWCRMS.png";

export default function Banner() {
  const style = { backgroundImage: `url(${banner})` };
  return (
    <div className="banner-wrapper">
      <div className="banner-track" style={style} role="img" aria-label="Election banner" />
    </div>
  );
}
