import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const { axios, setToken } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isSignup ? "/user/register" : "/user/login";

    try {
      const payload = isSignup
        ? { name, email, password } // register
        : { email, password }; // login

      const { data } = await axios.post(url, payload);

      if (data.success) {
        setToken(data.data.token); // ⚠️ FIX HERE
        localStorage.setItem("token", data.data.token);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center gap-10">
      <div className="w-full hidden md:flex items-center justify-center">
        <div className="flex items-center justify-center gap-10">
          {" "}
          <img
            className="h-[600px] w-auto object-contain"
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png"
            alt="leftSideImage"
          />
        </div>
      </div>

      <div className="w-full flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-10">
          <form
            onSubmit={handleSubmit}
            className="md:w-96 w-80 flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl font-medium text-gray-900 dark:text-white">
              {isSignup ? "Create Account" : "Sign in"}
            </h2>

            <p className="text-sm mt-3 text-gray-500/90 dark:text-gray-400">
              {isSignup
                ? "Create your account to get started"
                : "Welcome back! Please sign in to continue"}
            </p>

            <button
              type="button"
              className="w-full mt-8 bg-gray-500/10 dark:bg-white/10 flex items-center justify-center h-12 rounded-full"
            >
              <img
                src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg"
                alt="googleLogo"
              />
            </button>

            <div className="flex items-center gap-4 w-full my-5">
              <div className="w-full h-px bg-gray-300/90 dark:bg-gray-700"></div>
              <p className="w-full text-nowrap text-sm text-gray-500/90 dark:text-gray-400">
                or sign in with email
              </p>
              <div className="w-full h-px bg-gray-300/90 dark:bg-gray-700"></div>
            </div>
            <div className="w-full flex flex-col space-y-6">
              {/* Name */}
              {isSignup && (
                <div
                  className="flex items-center mt-6 w-full border h-12 rounded-full overflow-hidden pl-6 gap-2
    border-gray-300/60 dark:border-gray-600
    bg-transparent dark:bg-white/5"
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white outline-none text-sm w-full h-full
text-gray-500 placeholder-gray-500"
                    required
                  />
                </div>
              )}
              {/* Email */}

              <div
                className="flex items-center w-full border h-12 rounded-full overflow-hidden pl-6 gap-2
    border-gray-300/60 dark:border-gray-600
    bg-transparent dark:bg-white/5"
              >
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                    className="fill-gray-500 dark:fill-gray-400"
                  />
                </svg>

                <input
                  type="email"
                  placeholder="Email id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white outline-none text-sm w-full h-full
text-gray-500 placeholder-gray-500"
                  required
                />
              </div>

              {/* Password */}
              <div
                className="flex items-center  w-full border h-12 rounded-full overflow-hidden pl-6 gap-2
    border-gray-300/60 dark:border-gray-600
    bg-transparent dark:bg-white/5"
              >
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
                  <path
                    d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                    className="fill-gray-500 dark:fill-gray-400"
                  />
                </svg>

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white outline-none text-sm w-full h-full
text-gray-500 placeholder-gray-500"
                  required
                />
              </div>
            </div>
            {/* Remember + Forgot */}
            <div className="w-full flex items-center justify-between mt-8 text-gray-500/80 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <input
                  className="h-5 accent-indigo-500"
                  type="checkbox"
                  id="checkbox"
                />
                <label className="text-sm" htmlFor="checkbox">
                  Remember me
                </label>
              </div>
              <a className="text-sm underline hover:text-indigo-500" href="#">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="mt-8 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity"
            >
              {isSignup ? "Register" : "Login"}
            </button>

            <p className="text-gray-500/90 dark:text-gray-400 text-sm mt-4">
              {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-indigo-500 hover:underline"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
