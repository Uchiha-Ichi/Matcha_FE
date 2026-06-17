import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * LocationSearch — ô tìm kiếm địa chỉ dùng Nominatim (OpenStreetMap, free).
 *
 * Props:
 *   value        string   — giá trị hiện tại (location_name)
 *   onChange     fn(name, gps)  — callback khi chọn: (displayName, "POINT(lng lat)")
 *   placeholder  string   — placeholder của input
 *   disabled     bool
 */
export default function LocationSearch({ value, onChange, placeholder = 'Tìm địa chỉ...', disabled }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  // Đóng dropdown và reset query về value nếu click bên ngoài mà chưa chọn gợi ý
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setQuery(value || '')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [value])

  // Sync value từ ngoài vào (VD: khi load từ DB)
  useEffect(() => {
    if (value !== query) setQuery(value || '')
  }, [value])

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        format: 'json',
        limit: 6,
        countrycodes: 'vn',
        'accept-language': 'vi',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'Matcha-App/1.0' },
      })
      if (!res.ok) throw new Error('Không thể tìm kiếm địa chỉ')
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`,
            { headers: { 'User-Agent': 'Matcha-App/1.0' } }
          )
          if (!res.ok) throw new Error('Không thể giải mã tọa độ thành địa chỉ')
          const data = await res.json()

          const parts = data.display_name.split(', ')
          const shortName = parts.slice(0, 4).join(', ')
          const gps = `POINT(${longitude} ${latitude})`

          setQuery(shortName)
          onChange?.(shortName, gps)
        } catch (err) {
          const shortName = `Vị trí định vị (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          const gps = `POINT(${longitude} ${latitude})`
          setQuery(shortName)
          onChange?.(shortName, gps)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Cần cấp quyền vị trí trong trình duyệt để định vị.'
            : 'Không thể lấy vị trí hiện tại.'
        )
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onChange])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleSelect = (item) => {
    // Rút gọn display name: bỏ phần quốc gia ở cuối
    const parts = item.display_name.split(', ')
    // Giữ tối đa 4 phần đầu (tên đường, phường, quận, thành phố)
    const shortName = parts.slice(0, 4).join(', ')
    const gps = `POINT(${item.lon} ${item.lat})`
    setQuery(shortName)
    setResults([])
    setOpen(false)
    onChange?.(shortName, gps)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        @keyframes location-search-spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, pointerEvents: 'none', color: '#9b8a7b',
          zIndex: 2,
        }}>
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={(e) => {
            e.target.style.borderColor = '#1f1713'
            e.target.style.boxShadow = '0 0 0 3px rgba(31, 23, 19, 0.07)'
            e.target.style.background = '#fff'
            if (results.length > 0) setOpen(true)
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2d7c9'
            e.target.style.boxShadow = 'none'
            e.target.style.background = '#fcfaf6'
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          style={{
            width: '100%',
            minHeight: '50px',
            border: '1.5px solid #e2d7c9',
            borderRadius: '16px',
            background: '#fcfaf6',
            color: '#1f1713',
            paddingLeft: '40px',
            paddingRight: '40px',
            fontSize: '15px',
            fontWeight: 700,
            outline: 'none',
            transition: 'border-color 0.18s, box-shadow 0.18s, background-color 0.18s',
          }}
        />
        {loading ? (
          <span style={{
            position: 'absolute', right: 14, top: '50%',
            width: 16, height: 16, border: '2px solid #c8b8a8',
            borderTopColor: '#1f1713', borderRadius: '50%',
            display: 'inline-block', animation: 'location-search-spin 0.8s linear infinite',
            zIndex: 2,
          }} />
        ) : (
          <button
            type="button"
            onClick={locate}
            title="Định vị vị trí hiện tại"
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 16, color: '#9b8a7b', padding: '4px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, transform 0.15s',
              zIndex: 2,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#1f1713'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#9b8a7b'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            📍
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>
      )}

      {open && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e8ddd4', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
          listStyle: 'none', margin: 0, padding: '4px 0',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map((item) => {
            const parts = item.display_name.split(', ')
            const main = parts[0]
            const sub = parts.slice(1, 4).join(', ')
            return (
              <li
                key={item.place_id}
                onMouseDown={() => handleSelect(item)}
                style={{
                  padding: '10px 16px', cursor: 'pointer',
                  borderBottom: '1px solid #f0e8e0',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#faf5f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f1713' }}>
                  📍 {main}
                </div>
                {sub && (
                  <div style={{ fontSize: 12, color: '#9b8a7b', marginTop: 2 }}>
                    {sub}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
