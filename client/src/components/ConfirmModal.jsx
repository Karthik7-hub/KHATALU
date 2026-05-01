import { HiOutlineExclamationTriangle } from "react-icons/hi2";

export default function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  confirmColor = "btn-danger",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: "360px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icon-box icon-danger mx-auto mb-4" style={{ margin: "0 auto 16px", borderRadius: "50%" }}>
          <HiOutlineExclamationTriangle size={24} />
        </div>

        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>{title}</h2>
        <p className="text-secondary text-sm mb-6 pb-2 line-height-relaxed">{message}</p>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className={`btn ${confirmColor} flex-1`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
