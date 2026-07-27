"use client";

import Link from "next/link";
import FeatureAIHelper from "@/components/FeatureAIHelper";

export default function ProgressPage() {
  const subjects = [
    { name: "Computer Science", progress: 85 },
    { name: "Mathematics", progress: 72 },
    { name: "Physics", progress: 68 },
    { name: "Chemistry", progress: 91 },
  ];

  const weekly = [3, 5, 4, 7, 6, 8, 5];

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      {/* Navbar */}

      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">

        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300"
        >
          ← Dashboard
        </Link>

        <h1 className="text-3xl font-bold">
          📊 Study Progress
        </h1>

      </nav>

      <div className="max-w-7xl mx-auto p-8">

        {/* Top Cards */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-[#13131A] rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400">Study Hours</p>
            <h2 className="text-4xl font-bold mt-3 text-blue-400">
              48h
            </h2>
          </div>

          <div className="bg-[#13131A] rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400">Completed Tasks</p>
            <h2 className="text-4xl font-bold mt-3 text-green-400">
              32
            </h2>
          </div>

          <div className="bg-[#13131A] rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400">Study Streak</p>
            <h2 className="text-4xl font-bold mt-3 text-orange-400">
              🔥 12 Days
            </h2>
          </div>

          <div className="bg-[#13131A] rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400">Goal Completion</p>
            <h2 className="text-4xl font-bold mt-3 text-purple-400">
              84%
            </h2>
          </div>

        </div>

        <FeatureAIHelper
          title="AI Progress Assistant"
          placeholder="Ask me how to improve my study progress..."
          helperText="Use this panel to get advice based on your study progress."
          promptPrefix="Help me improve my study progress: "
        />

        {/* Weekly Chart */}

        <div className="mt-10 bg-[#13131A] rounded-2xl border border-gray-800 p-8">

          <h2 className="text-2xl font-bold mb-8">
            📈 Weekly Study Hours
          </h2>

          <div className="flex items-end justify-between h-72">

            {weekly.map((value, index) => (

              <div
                key={index}
                className="flex flex-col items-center gap-3"
              >

                <div
                  className="w-10 bg-blue-500 rounded-t-xl"
                  style={{
                    height: `${value * 30}px`,
                  }}
                ></div>

                <p className="text-gray-400">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}
                </p>

              </div>

            ))}

          </div>

        </div>

        {/* Subject Progress */}

        <div className="mt-10 bg-[#13131A] rounded-2xl border border-gray-800 p-8">

          <h2 className="text-2xl font-bold mb-8">
            📚 Subject Performance
          </h2>

          <div className="space-y-6">

            {subjects.map((subject) => (

              <div key={subject.name}>

                <div className="flex justify-between mb-2">

                  <p>{subject.name}</p>

                  <p>{subject.progress}%</p>

                </div>

                <div className="w-full h-4 bg-gray-700 rounded-full">

                  <div
                    className="h-4 rounded-full bg-green-500"
                    style={{
                      width: `${subject.progress}%`,
                    }}
                  ></div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* Achievements */}

        <div className="mt-10">

          <h2 className="text-2xl font-bold mb-6">
            🏆 Achievements
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-[#13131A] rounded-2xl p-6 border border-yellow-500 text-center">
              🥇
              <h3 className="mt-3 font-bold">
                Top Learner
              </h3>
            </div>

            <div className="bg-[#13131A] rounded-2xl p-6 border border-orange-500 text-center">
              🔥
              <h3 className="mt-3 font-bold">
                12 Day Streak
              </h3>
            </div>

            <div className="bg-[#13131A] rounded-2xl p-6 border border-blue-500 text-center">
              📚
              <h3 className="mt-3 font-bold">
                Book Master
              </h3>
            </div>

            <div className="bg-[#13131A] rounded-2xl p-6 border border-green-500 text-center">
              🎯
              <h3 className="mt-3 font-bold">
                Goal Achiever
              </h3>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}