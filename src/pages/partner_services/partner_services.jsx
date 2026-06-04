import { useState } from 'react'
import {
  mockConcepts,
  mockPartnerConcepts,
  mockPartners,
} from '../../../mockdata.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import '../partner_dashboard/partner_dashboard.css'
import '../partner_bookings/partner_bookings.css'
import './partner_services.css'

const fixVnText = (text) => {
  if (typeof text !== 'string') return text
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const buildServices = () => {
  const partner = mockPartners[0]
  const conceptById = new Map(mockConcepts.map((concept) => [concept.id, concept]))

  return {
    partner: { ...partner, band_name: fixVnText(partner.band_name) },
    services: mockPartnerConcepts
      .filter((item) => item.partner_id === partner.id)
      .map((item) => ({
        ...item,
        conceptName: fixVnText(conceptById.get(item.concept_id)?.name) ?? 'Concept',
      })),
  }
}

function PartnerServices() {
  const { partner, services } = buildServices()
  const [serviceDraft, setServiceDraft] = useState({
    concept_id: mockConcepts[0]?.id ?? 1,
    price: '',
    time: '',
    image_des: '',
  })

  const updateDraft = (field, value) => {
    setServiceDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-services" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading">
          <div>
            <span>SERVICE MANAGEMENT</span>
            <h1>Dịch vụ của partner</h1>
            <p>Quản lý các gói dịch vụ trong bảng Partner_Concept và chuẩn bị payload để gọi API.</p>
          </div>
        </div>

        <section className="partner-services-layout">
          <div className="partner-service-management-grid">
            {services.map((service) => (
              <article key={service.id} className="partner-service-manage-card">
                <span>{service.time}</span>
                <h2>{service.conceptName}</h2>
                <p>{service.image_des}</p>
                <strong>{formatPrice(service.price)}</strong>
                <div>
                  <button type="button">Sửa</button>
                  <button type="button">Tạm ẩn</button>
                </div>
              </article>
            ))}
          </div>

          <form className="partner-service-form">
            <span>THÊM PARTNER_CONCEPT</span>
            <h2>Dịch vụ mới</h2>
            <label>
              <span>Concept</span>
              <select
                value={serviceDraft.concept_id}
                onChange={(event) => updateDraft('concept_id', event.target.value)}
              >
                {mockConcepts.map((concept) => (
                  <option key={concept.id} value={concept.id}>
                    {fixVnText(concept.name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Giá</span>
              <input
                type="number"
                value={serviceDraft.price}
                onChange={(event) => updateDraft('price', event.target.value)}
                placeholder="1200000"
              />
            </label>
            <label>
              <span>Thời lượng</span>
              <input
                value={serviceDraft.time}
                onChange={(event) => updateDraft('time', event.target.value)}
                placeholder="3h"
              />
            </label>
            <label>
              <span>Mô tả ảnh / image_des</span>
              <textarea
                value={serviceDraft.image_des}
                onChange={(event) => updateDraft('image_des', event.target.value)}
                placeholder="ky-yeu.jpg hoặc mô tả ảnh minh họa"
              />
            </label>
            <button type="button">Lưu dịch vụ mock</button>
          </form>
        </section>
      </section>
    </main>
  )
}

export default PartnerServices
