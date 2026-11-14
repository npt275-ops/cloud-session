# Bước 28 · Bỏ sông và cầu trong đảo, hồ thủng thẳng xuống biển

Yêu cầu: bỏ các cầu bắc qua sông trong đảo. Sông, hồ phải liền khối với đảo: nhảy xuống hồ là rơi thẳng xuống biển. Nét
sông khó vẽ cho sạch, nên bỏ hết sông, chỉ giữ hồ, và sửa hồ cho hết lỗi trên bản đồ.

## 1. Bỏ sông, cầu và mặt nước giả

- render/map/terrain3d.js:
  - bỏ sông chính ở Lúa Vàng và Thông Xanh (L.river, L.riverBank, đồ trang trí ven sông);
  - bỏ water(), flat(), waterMat(), moveLake();
  - L.waterMats để trống.
- render/map/relief3d.js:
  - bỏ sông phụ và cầu qua sông (riverBridges, BRIDGE);
  - bỏ mặt nước của hồ, ao;
  - WATERS chỉ còn hồ, ao.
- render/map/height3d.js:
  - surfAt không còn tính mặt cầu;
  - bỏ nhánh nâng mặt nước.

## 2. Hồ là lỗ thủng xuyên đảo

- Mỗi hồ là một đường viền [[x, z], ...] ghi vào L.holes (L.addHole).
- Mặt đảo và mặt dưới đảo bỏ không vẽ chỗ lỗ. Có một mặt nạ 512×512 phủ đảo; shader đọc mặt nạ và discard (height3d holes).
- Quanh mép lỗ có vách đất đá, từ mặt đất xuống tới mặt dưới đảo (L.underY), màu theo vân đá của miền.
- Nhìn qua lỗ thấy mặt biển thật (sea3d.js). Rơi qua lỗ là xuống biển rồi xuống đáy bể.
- Mỗi đảo một hồ dáng riêng:

  | Đảo | Dáng hồ | Trang trí |
  |---|---|---|
  | Lúa Vàng | quả thận | cỏ lác, hoa |
  | Thông Xanh | bờ lượn | lau sậy |
  | Đá Mây | giọt nước | đá cuội |
  | Tuyết Trắng | sáu cạnh | – |
  | Cửa Sóng | đầm hình hoa | dừa |
  | Cát Hồng | ốc đảo trăng khuyết | – |

- Thêm hồ, ao rải ở vòng ngoài (relief3d WATERS).

## 3. Chỗ đặt hồ: không đè đường, làng, công trình

Ảnh chụp đầu tiên thấy bốn lỗi:
- đường Tuyết Trắng chạy ngang hồ;
- bãi cát Cửa Sóng cắt vào ao;
- ao lấn sân đá;
- một số công trình, bãi làm việc đứng trên hồ.

Nguyên nhân: hồ đặt theo vòng tròn xấp xỉ, có hồ còn nằm trong làng.

Sửa:
- L.holeFits(đường viền) (terrain3d) kiểm từng điểm của đường viền thật. Mỗi điểm phải:
  - ở ngoài vòng làng (bán kính 28);
  - cách mép đảo 6 (chỗ tường, cầu tàu);
  - không lấn đường, có chừa chỗ đèn và cây ven đường;
  - không đè khối lớn (L.props, gồm các hồ đã có);
  - không đè dải cong đã trải (L.dry: bãi cát, hẻm núi; ribbon tự ghi).
- Hồ chính tìm chỗ gần chỗ định nhất: hole() → nearest(..., all), tìm xa hơn và quanh cả vòng. Hồ, ao thêm ở relief3d cũng dùng
  L.holeFits.
- Mỗi lỗ ghi vào L.props một vòng phủ hết đường viền, thêm 0,6. Cây, người, công trình tránh vòng này.
- Cửa Sóng trải bãi cát trước, rồi mới đặt đầm.
- L.inHole(x, z, m) (height3d) cho biết một điểm có trong lỗ, hay sát mép lỗ, không.
- Công trình (render/build/place3d.js blocks):
  - phần sát đất thật của công trình rơi vào lỗ, hay cách mép lỗ dưới 1,2, thì tính như lấn đường;
  - clearRoad sẽ dời công trình đi.
- Bãi làm việc (workyards3d) cũng tránh lỗ.
- Bỏ L.lake, L.lakeR, L.lagoon và setLake, vì không còn nơi nào đọc.

## 4. Kiểm chứng

- tools/check-footing.js đo thêm số đỉnh sát đất rơi vào lỗ hồ, của mọi món trên 6 đảo × 12 thời (cả đường, tường, bãi):

  | Lúc đo | Số món đè hồ |
  |---|---|
  | Trước khi sửa | 67 |
  | Sau khi sửa | 0 |

  Kiểm thò ra ngoài đảo vẫn đạt.
- Ảnh chụp từ trên xuống từng hồ: nhìn qua lỗ thấy biển, vách đá quanh mép, không đường nào cắt ngang.
- Kiểm thử: 92/92 đạt.

## 5. Sóng đứng yên trên máy bật "giảm chuyển động"

- Báo lỗi: sóng biển không chuyển động.
- Nguyên nhân: sea3d.js animate chỉ cho thời gian của sóng chạy khi máy không bật "giảm chuyển động"
  (prefers-reduced-motion). Bật cài đặt này thì mặt biển đứng yên hẳn. Máy hay bật sẵn cài đặt này:
  - iPhone, iPad: Reduce Motion;
  - Windows: tắt hiệu ứng động;
  - Android: xoá hoạt ảnh.
- Sửa: bật "giảm chuyển động" thì sóng chậm lại còn 0,4 lần, như mây và tuyết đang làm, không đứng yên nữa.
  Nước dưới đáy bể (render/deep3d.js) cũng vậy.
- Đo độ cao mặt biển tại một điểm, ba lần cách nhau 1,2 giây:

  | Chế độ | Trước khi sửa | Sau khi sửa |
  |---|---|---|
  | Bình thường | thay đổi | thay đổi |
  | Giảm chuyển động | −0,946 cả ba lần | −0,68, −0,49, −0,76 |
