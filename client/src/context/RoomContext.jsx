import { createContext, useContext, useState, useCallback } from "react";
import api from "../config/api";
import toast from "react-hot-toast";

const RoomContext = createContext(null);

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}

export function RoomProvider({ children }) {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── Fetch user's rooms ──────────────────────────────────────────────
  const fetchMyRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/room/my-rooms");
      setRooms(response.data.rooms);
      return response.data.rooms;
    } catch (error) {
      console.error("Fetch rooms error:", error);
      toast.error("Failed to fetch rooms");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Create a new room ──────────────────────────────────────────────
  const createRoom = useCallback(async (roomName) => {
    try {
      setLoading(true);
      const response = await api.post("/room/create", { roomName });
      const newRoom = response.data;

      toast.success(`Room "${roomName}" created!`);
      setCurrentRoom(newRoom);
      localStorage.setItem("currentRoomId", newRoom.roomId);

      return newRoom;
    } catch (error) {
      console.error("Create room error:", error);
      toast.error(error.response?.data?.error || "Failed to create room");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Join a room via code ────────────────────────────────────────────
  const joinRoom = useCallback(async (joinCode) => {
    try {
      setLoading(true);
      const response = await api.post("/room/join", { joinCode });
      const joinedRoom = response.data;

      toast.success(`Joined "${joinedRoom.roomName}"!`);
      setCurrentRoom(joinedRoom);
      localStorage.setItem("currentRoomId", joinedRoom.roomId);

      return joinedRoom;
    } catch (error) {
      console.error("Join room error:", error);
      toast.error(error.response?.data?.error || "Failed to join room");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch dashboard data ───────────────────────────────────────────
  const fetchDashboard = useCallback(async (roomId) => {
    try {
      setLoading(true);
      const response = await api.get(`/room/${roomId}/dashboard`);
      setDashboard(response.data);
      setCurrentRoom(response.data.roomDetails);
      return response.data;
    } catch (error) {
      console.error("Fetch dashboard error:", error);
      toast.error(error.response?.data?.error || "Failed to load dashboard");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Add expense ────────────────────────────────────────────────────
  const addExpense = useCallback(async (expenseData) => {
    try {
      const response = await api.post("/expense", expenseData);
      toast.success("Expense added!");
      return response.data;
    } catch (error) {
      console.error("Add expense error:", error);
      toast.error(error.response?.data?.error || "Failed to add expense");
      throw error;
    }
  }, []);

  // ─── Delete expense ─────────────────────────────────────────────────
  const deleteExpense = useCallback(async (expenseId) => {
    try {
      const response = await api.delete(`/expense/${expenseId}`);
      toast.success("Expense deleted");
      return response.data;
    } catch (error) {
      console.error("Delete expense error:", error);
      toast.error(error.response?.data?.error || "Failed to delete expense");
      throw error;
    }
  }, []);

  // ─── Leave room ─────────────────────────────────────────────────────
  const leaveRoom = useCallback(async (roomId) => {
    try {
      await api.post(`/room/${roomId}/leave`);
      toast.success("Left the room");
      setCurrentRoom(null);
      setDashboard(null);
      localStorage.removeItem("currentRoomId");
    } catch (error) {
      console.error("Leave room error:", error);
      toast.error(error.response?.data?.error || "Failed to leave room");
      throw error;
    }
  }, []);

  // ─── Remove member (admin only) ─────────────────────────────────────
  const removeMember = useCallback(async (roomId, memberId) => {
    try {
      await api.delete(`/room/${roomId}/member/${memberId}`);
      toast.success("Member removed");
    } catch (error) {
      console.error("Remove member error:", error);
      toast.error(error.response?.data?.error || "Failed to remove member");
      throw error;
    }
  }, []);

  // ─── Delete room (admin only) ───────────────────────────────────────
  const deleteRoom = useCallback(async (roomId) => {
    try {
      await api.delete(`/room/${roomId}`);
      toast.success("Room deleted");
      setCurrentRoom(null);
      setDashboard(null);
      localStorage.removeItem("currentRoomId");
    } catch (error) {
      console.error("Delete room error:", error);
      toast.error(error.response?.data?.error || "Failed to delete room");
      throw error;
    }
  }, []);

  // ─── Create category ──────────────────────────────────────────────────
  const createCategory = useCallback(async (categoryData) => {
    try {
      const response = await api.post("/category", categoryData);
      toast.success(`Category "${categoryData.name}" created!`);
      return response.data;
    } catch (error) {
      console.error("Create category error:", error);
      toast.error(error.response?.data?.error || "Failed to create category");
      throw error;
    }
  }, []);

  const value = {
    currentRoom,
    rooms,
    dashboard,
    loading,
    setCurrentRoom,
    fetchMyRooms,
    createRoom,
    joinRoom,
    fetchDashboard,
    addExpense,
    deleteExpense,
    leaveRoom,
    removeMember,
    deleteRoom,
    createCategory,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
