import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePlus,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUsers,
  HiOutlineArrowRightStartOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import "./RoomLobby.css";

export default function RoomLobby() {
  const { user, logout } = useAuth();
  const { rooms, loading, fetchMyRooms, createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null); // null | "create" | "join"
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyRooms();
  }, [fetchMyRooms]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    try {
      setSubmitting(true);
      const room = await createRoom(roomName.trim());
      setDrawerOpen(false);
      setDrawerMode(null);
      setRoomName("");
      navigate(`/room/${room.roomId}`);
    } catch { } 
    finally { setSubmitting(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (joinCode.trim().length !== 6) return;
    try {
      setSubmitting(true);
      const room = await joinRoom(joinCode.trim().toUpperCase());
      setDrawerOpen(false);
      setDrawerMode(null);
      setJoinCode("");
      navigate(`/room/${room.roomId}`);
    } catch { } 
    finally { setSubmitting(false); }
  };

  const openDrawerWith = (mode) => {
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="lobby-page">
      {/* Animated gradient mesh */}
      <div className="lobby-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Top Bar: Logo Left, Menu Right */}
      <div className="lobby-topbar">
        <div className="topbar-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Khatalu" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
          </div>
          <span className="logo-text">Khatalu</span>
        </div>
        <button className="menu-trigger" onClick={() => setDrawerOpen(true)}>
          <HiOutlineBars3 size={22} />
        </button>
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setDrawerOpen(false); setDrawerMode(null); }}
            />
            <motion.div 
              className="drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="drawer-header">
                <div className="drawer-user">
                  <div className="drawer-avatar">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="drawer-user-info">
                    <h3>{user?.name}</h3>
                    <p>{user?.email}</p>
                  </div>
                </div>
                <button className="drawer-close" onClick={() => { setDrawerOpen(false); setDrawerMode(null); }}>
                  <HiOutlineXMark size={18} />
                </button>
              </div>

              <div className="drawer-body">
                {/* Create Room */}
                <button className="drawer-item" onClick={() => setDrawerMode(drawerMode === "create" ? null : "create")}>
                  <div className="item-icon blue"><HiOutlinePlus size={20} /></div>
                  Create Room
                </button>

                <AnimatePresence>
                  {drawerMode === "create" && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="drawer-form"
                      onSubmit={handleCreate}
                    >
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room name (e.g. Flat 4B)"
                        className="drawer-input"
                        maxLength={50}
                        autoFocus
                      />
                      <button type="submit" disabled={!roomName.trim() || submitting} className="drawer-submit">
                        {submitting ? "Creating..." : "Create Room"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Join Room */}
                <button className="drawer-item" onClick={() => setDrawerMode(drawerMode === "join" ? null : "join")}>
                  <div className="item-icon emerald"><HiOutlineArrowRightOnRectangle size={20} /></div>
                  Join Room
                </button>

                <AnimatePresence>
                  {drawerMode === "join" && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="drawer-form"
                      onSubmit={handleJoin}
                    >
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                        placeholder="6-character code"
                        className="drawer-input"
                        style={{ letterSpacing: "3px", textTransform: "uppercase" }}
                        maxLength={6}
                        autoFocus
                      />
                      <button type="submit" disabled={joinCode.length !== 6 || submitting} className="drawer-submit">
                        {submitting ? "Joining..." : "Join Room"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="drawer-divider"></div>

                {/* Logout */}
                <button className="drawer-item" onClick={logout}>
                  <div className="item-icon red"><HiOutlineArrowRightStartOnRectangle size={20} /></div>
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - ONLY Rooms */}
      <div className="lobby-main">
        {loading && rooms.length === 0 ? (
          <div className="lobby-loader">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
            />
          </div>
        ) : rooms.length > 0 ? (
          <div className="rooms-list">
            {rooms.map((room, index) => (
              <motion.div
                key={room._id}
                className="room-card"
                onClick={() => navigate(`/room/${room._id}`)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="room-card-top">
                  <div className="room-icon">
                    {room.roomName?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="join-code-pill">{room.joinCode}</span>
                </div>
                <div className="room-card-body">
                  <h2>{room.roomName}</h2>
                  <div className="room-meta">
                    <div className="room-meta-item">
                      <HiOutlineUsers size={16} />
                      {room.members?.length} member{room.members?.length !== 1 ? "s" : ""}
                    </div>
                    <div className="room-meta-item">
                      <HiOutlineCalendarDays size={16} />
                      {formatDate(room.createdAt)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="empty-icon">
              <img src="/logo.png" alt="Khatalu" style={{ width: "48px", height: "48px", borderRadius: "12px", opacity: 0.8 }} />
            </div>
            <h2>No groups yet</h2>
            <p>Create a group to start tracking shared expenses with your people, or join an existing one with a 6-character code.</p>
            <motion.button
              className="empty-cta"
              whileTap={{ scale: 0.97 }}
              onClick={() => openDrawerWith("create")}
            >
              <HiOutlinePlus size={20} />
              Create Your First Room
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
