import React, { useEffect } from "react"; // ✅ added useEffect
import { useNavigate } from "react-router-dom";

const Loading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeOut = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timeOut);
  }, [navigate]); // ✅ added dependency (best practice)

  return (
    <div
      className="bg-gradient-to-b from-[#531881] to-[#291848]
      backdrop-opacity-60 flex items-center justify-center h-screen w-screen
      text-white text-2xl"
    >
      <div
        className="w-10 h-10 rounded-full border-3 border-white
        border-t-transparent animate-spin"
      ></div>
    </div>
  );
};

export default Loading;
