"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

type Task = {
  id: number;
  title: string;
  time: string;
  completed: boolean;
};

export default function PlannerPage() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("brainbuddy_tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!title || !time) {
      alert("Please enter task and time.");
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title,
      time,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    addHistoryItem("Planner", `Added Study Task: ${title}`, `Scheduled at ${time}`);
    setTitle("");
    setTime("");
  }

  function toggleTask(id: number) {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id: number) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  const completed = tasks.filter((t) => t.completed).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

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
          📅 Smart Study Planner
        </h1>

      </nav>

      <div className="max-w-6xl mx-auto p-8">

        {/* Add Task */}

        <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Add Study Task
          </h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Study Topic..."
            className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 mb-5"
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 mb-5"
          />

          <button
            onClick={addTask}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-semibold"
          >
            ➕ Add Task
          </button>

        </div>


        {/* Progress */}

        <div className="mt-8 bg-[#13131A] rounded-2xl border border-gray-800 p-6">

          <div className="flex justify-between mb-3">

            <h2 className="text-xl font-bold">
              Today's Progress
            </h2>

            <span className="text-blue-400">
              {progress}%
            </span>

          </div>

          <div className="w-full h-4 bg-gray-700 rounded-full">

            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>

          </div>

        </div>

        {/* Tasks */}

        <div className="mt-8 space-y-4">

          {tasks.length === 0 && (

            <div className="bg-[#13131A] p-8 rounded-2xl text-center border border-gray-800">

              <h2 className="text-2xl">
                No Study Tasks Yet 📚
              </h2>

            </div>

          )}

          {tasks.map((task) => (

            <div
              key={task.id}
              className="bg-[#13131A] rounded-2xl border border-gray-800 p-6 flex justify-between items-center"
            >

              <div>

                <h2
                  className={`text-xl font-bold ${
                    task.completed
                      ? "line-through text-green-400"
                      : ""
                  }`}
                >
                  {task.title}
                </h2>

                <p className="text-blue-400 mt-2">
                  ⏰ {task.time}
                </p>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => toggleTask(task.id)}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl"
                >
                  {task.completed ? "Undo" : "Done"}
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl"
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}