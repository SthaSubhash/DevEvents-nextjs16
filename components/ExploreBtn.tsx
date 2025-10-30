"use client";
import Image from "next/image";

export default function ExploreBtn() {
  return (
    <button
      type="button"
      id="explore-btn"
      onClick={() => console.log("CLICKED!")}
      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white mt-7 mx-auto rounded-full shadow-lg hover:to-purple-700 transition-shadow duration-300"
    >
      <a href="#events">
        Explore Events
        <Image
          src="/icons/arrow-down.svg"
          alt="arrow down"
          width={24}
          height={24}
        />
      </a>
    </button>
  );
}
