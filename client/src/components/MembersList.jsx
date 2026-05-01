import { useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { useRoom } from "../context/RoomContext";
import ConfirmModal from "./ConfirmModal";

export default function MembersList({ members, adminId, currentUserId, roomId, onRefresh }) {
  const { removeMember } = useRoom();
  const [removingMember, setRemovingMember] = useState(null);

  const adminIdStr = adminId?._id?.toString() || adminId?.toString();
  const isCurrentUserAdmin = currentUserId === adminIdStr;

  const handleRemove = async () => {
    if (!removingMember) return;
    try {
      await removeMember(roomId, removingMember._id);
      setRemovingMember(null);
      onRefresh();
    } catch {
      // handled in context
    }
  };

  return (
    <div className="card">
      <h3 className="mb-4">Members ({members.length})</h3>

      <div className="list-container">
        {members.map((member) => {
          const memberId = member._id?.toString();
          const isAdmin = memberId === adminIdStr;
          const isCurrentUser = memberId === currentUserId;

          return (
            <div key={memberId} className="list-row">
              <div className="flex items-center gap-3">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar">{member.name?.charAt(0)?.toUpperCase()}</div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {member.name}
                      {isCurrentUser && <span className="text-muted text-xs mx-1">(you)</span>}
                    </span>
                    {isAdmin && <span className="badge badge-warning" title="Room Admin">Admin</span>}
                  </div>
                  <p className="text-secondary text-xs">{member.email}</p>
                </div>
              </div>

              {isCurrentUserAdmin && !isAdmin && (
                <button
                  onClick={() => setRemovingMember(member)}
                  className="btn btn-ghost text-danger"
                  title="Remove member"
                  style={{ padding: "4px" }}
                >
                  <HiOutlineXMark size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {removingMember && (
        <ConfirmModal
          title="Remove Member"
          message={`Are you sure you want to remove ${removingMember.name} from this room?`}
          confirmText="Remove"
          confirmColor="btn-danger"
          onConfirm={handleRemove}
          onCancel={() => setRemovingMember(null)}
        />
      )}
    </div>
  );
}
