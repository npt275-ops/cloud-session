// SamBox · src/world/daytime.js · Bốn buổi trong ngày (thuần dữ liệu): màu trời, nắng, sương, nước, chỉnh màu hậu kỳ
// Theo ảnh đích: hoàng hôn tím vàng (ảnh 8–11) là buổi mặc định; đêm trăng xanh có đom đóm (ảnh 6).
//   sun        elev (độ cao, độ), azim (hướng, độ; 180 = phía sau đảo khi nhìn từ máy quay mặc định → ánh sáng ngược), màu, cường độ
//   hemi       trời (màu sáng từ trên), đất (màu bóng: ngả tím, không đen)
//   sky        zenith (đỉnh trời), horizon (chân trời), glow (quầng quanh mặt trời)
//   fog        màu, gần, xa       water: shallow (nước nông), deep (nước sâu), glint (độ loá)       cloud: màu mây
//   grade      shadow (màu phủ chỗ tối), high (màu phủ chỗ sáng), sat (độ đậm màu)    rim: viền sáng
export const DAYTIME = {
  dawn: {
    name: 'Bình minh',
    sun: { elev: 12, azim: 125, color: '#ffc8a0', intensity: 2.4 },
    hemi: { sky: '#c9c4ee', ground: '#7d6a9a', intensity: 1.1 },
    sky: { zenith: '#7f95d8', horizon: '#ffd2c2', glow: '#ffb08a' },
    fog: { color: '#d9c8e2', near: 750, far: 3450 },
    water: { shallow: '#86e0d6', deep: '#3a6eb0' },
    cloud: '#ffe2d6',
    exposure: 1.0, bloom: 0.45, rim: 0.9,
    grade: { shadow: '#9a8cc8', high: '#fff0dc', sat: 1.08 },
  },
  noon: {
    name: 'Trưa',
    sun: { elev: 58, azim: 160, color: '#fff4dc', intensity: 2.6 },
    hemi: { sky: '#cfe4ff', ground: '#8a86a8', intensity: 1.15 },
    sky: { zenith: '#5d9ae6', horizon: '#cfe6f6', glow: '#fff6dc' },
    fog: { color: '#cfe0ee', near: 1050, far: 4200 },
    water: { shallow: '#6fe0d2', deep: '#2f6db2', glint: 0.5 },
    cloud: '#ffffff',
    exposure: 1.0, bloom: 0.25, rim: 0.4,
    grade: { shadow: '#a8b4d8', high: '#fffaf0', sat: 1.05 },
  },
  sunset: {
    name: 'Hoàng hôn',
    sun: { elev: 14, azim: 235, color: '#ffbe78', intensity: 2.7 },
    hemi: { sky: '#c4b8ec', ground: '#86769e', intensity: 1.2 },
    sky: { zenith: '#8a8ee0', horizon: '#ffcaa8', glow: '#ffae6a' },
    fog: { color: '#e4c8d2', near: 900, far: 4050 },
    water: { shallow: '#8fdcd8', deep: '#3a72b2' },
    cloud: '#ffd2c8',
    exposure: 1.0, bloom: 0.42, rim: 1.1,
    grade: { shadow: '#a496cc', high: '#ffe6c4', sat: 1.1 },
  },
  night: {
    name: 'Đêm',
    sun: { elev: 35, azim: 220, color: '#9fb6ff', intensity: 0.7 },
    hemi: { sky: '#3e4f96', ground: '#1e2350', intensity: 0.8 },
    sky: { zenith: '#0c1236', horizon: '#3a3f86', glow: '#6f86d8' },
    fog: { color: '#2a3168', near: 525, far: 2700 },
    water: { shallow: '#2f6f9a', deep: '#141c4a', glint: 0.35 },
    cloud: '#5a65a8',
    exposure: 1.0, bloom: 0.55, rim: 0.8, stars: true, fireflies: true,
    grade: { shadow: '#5560b8', high: '#c8d8ff', sat: 1.05 },
  },
};
