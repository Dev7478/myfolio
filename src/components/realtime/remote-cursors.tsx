"use client";
import { SocketContext, User, UserMap } from "@/contexts/socketio";
import { useMouse } from "@/hooks/use-mouse";
import { useThrottle } from "@/hooks/use-throttle";
import { MousePointer2 } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

const RemoteCursors = () => {
  const { socket, users: _users, setUsers } = useContext(SocketContext);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // ❌ removed allowPage:true → viewport coordinates only
  const { x, y } = useMouse();

  useEffect(() => {
    if (!socket || isMobile) return;

    socket.on("cursor-changed", (data) => {
      setUsers((prev: UserMap) => {
        const newMap = new Map(prev);
        newMap.set(data.socketId, {
          ...(prev.get(data.socketId) || {}),
          ...data,
        });
        return newMap;
      });
    });

    socket.on("users-updated", (data: User[]) => {
      const newMap = new Map();
      data.forEach((user) => newMap.set(user.socketId, user));
      setUsers(newMap);
    });

    return () => {
      socket.off("cursor-changed");
      socket.off("users-updated");
    };
  }, [socket, isMobile, setUsers]);

  const handleMouseMove = useThrottle((x: number, y: number) => {
    socket?.emit("cursor-change", {
      pos: { x, y },
      socketId: socket.id,
    });
  }, 200);

  useEffect(() => {
    if (!isMobile) handleMouseMove(x, y);
  }, [x, y, isMobile, handleMouseMove]);

  const users = Array.from(_users.values());

  return (
    // ✅ fixed cursor layer
    <div className="fixed inset-0 z-[999999] pointer-events-none">
      {users
        .filter((user) => user.socketId !== socket?.id)
        .map((user) => (
          <Cursor
            key={user.socketId}
            x={user.pos.x}
            y={user.pos.y}
            color={user.color}
            socketId={user.socketId}
            headerText={`${user.location} ${user.flag}`}
          />
        ))}
    </div>
  );
};

const Cursor = ({
  color,
  x,
  y,
  headerText,
  socketId,
}: {
  x: number;
  y: number;
  color?: string;
  headerText: string;
  socketId: string;
}) => {
  const [showText, setShowText] = useState(false);
  const [msgText, setMsgText] = useState("");
  const { msgs } = useContext(SocketContext);

  useEffect(() => {
    setShowText(true);
    const t = setTimeout(() => setShowText(false), 3000);
    return () => clearTimeout(t);
  }, [x, y, msgText]);

  useEffect(() => {
    if (msgs.at(-1)?.socketId === socketId) {
      const content = msgs.at(-1)?.content || "";
      const text = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      setMsgText(text);

      const t = setTimeout(() => setMsgText(""), Math.min(4000, text.length * 100));
      return () => clearTimeout(t);
    }
  }, [msgs, socketId]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
      animate={{ x, y }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <MousePointer2
        className="w-6 h-6"
        style={{ color }}
        strokeWidth={7.2}
      />

      <AnimatePresence>
        {showText && headerText && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -7 }}
            exit={{ opacity: 0, y: -20 }}
            className="ml-4 text-xs rounded-xl p-2 px-4 w-fit"
            style={{ backgroundColor: color + "f0" }}
          >
            <div className="text-nowrap">{headerText}</div>
            {msgText && <div className="font-mono w-44">{msgText}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RemoteCursors;
