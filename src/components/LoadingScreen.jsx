import './LoadingScreen.css'

export default function LoadingScreen({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="matcha-loading-overlay" role="alert" aria-busy="true">
      <div className="matcha-loading-container">
        <div className="matcha-loading-spinner-wrap">
          <div className="matcha-loading-pulse" />
          <div className="matcha-loading-ring" />
          <svg
            className="matcha-loading-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <p className="matcha-loading-text">{text}</p>
      </div>
    </div>
  )
}
