# Bản đồ mã nguồn Bể Kính

Tự sinh bởi `node tools/code-map.js` từ dòng tiêu đề và code của từng tệp: **đừng sửa tay**. Thêm, đổi, xoá tệp
thì chạy lại lệnh đó (`node --test test/*.js` báo lỗi nếu tệp này cũ). Cách làm việc với code: `README.md` mục
"Làm việc với code".

Cột "Tạo ra": `BK.X` là mô-đun dùng chung, tên in hoa không có `BK.` là biến toàn cục, "G: n dịch vụ" là số dịch
vụ tệp thêm vào đối tượng G của game (tên từng dịch vụ: mục "Dịch vụ G" cuối trang). Cột "Dùng": các tệp mà tệp
này cần (dò theo tên trong code).

Tổng: 155 tệp, 44360 dòng.

## (gốc)

Gốc: biển, mây, âm thanh (dựng trước các phần khác).

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `audio.js` | 539 | Âm thanh tự sinh bằng Web Audio (không dùng file âm thanh nào) | `CityAudio` |  |
| `clouds3d.js` | 494 | Mây trong bể kính | `Clouds3D` |  |
| `sea3d.js` | 308 | Biển trong bể kính: mặt nước phủ kín đáy bể tới mép trong vách kính, sóng, chậu kính trong suốt chứa nước | `BK.SEA_Y` `BK.seaAt` `Sea3D` |  |

## game/

Ghép game: vòng lặp, thế giới, mùa, thiên nhiên, các đảo chạy cùng logic.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `game/cities.js` | 1099 | Sáu thành phố chạy theo đồng hồ của trận … | `BK.GameCities` G: 26 dịch vụ | `game/seasons.js` `game/world.js` `logic/arms.js` `logic/climate.js` `logic/construction.js` `logic/diplomacy.js` `logic/dramas.js` `logic/economy.js` `logic/eras.js` `logic/island.js` `logic/missiles.js` `logic/rules.js` `logic/save.js` `logic/schedule.js` `logic/siege.js` `logic/war.js` `logic/world.js` `render/build/isles/compose.js` `render/build/plains/common.js` `render/buildings3d.js` `render/engines3d.js` `render/hpbars3d.js` `render/map/map3d.js` `render/missiles3d.js` `render/prosper3d.js` `render/shots3d.js` `render/travel3d.js` `render/village3d.js` `render/war3d.js` `ui/camera-fly.js` `ui/landbar.js` `ui/village-ui.js` |
| `game/loop.js` | 105 | Khởi động game và nhịp mỗi khung hình | `BK.GameLoop` G: 1 dịch vụ | `game/cities.js` `game/nature.js` `game/seasons.js` `game/world.js` `render/look3d.js` `render/map/map3d.js` `render/neon3d.js` `render/perf3d.js` `render/scene3d.js` `render/sky3d.js` `render/snow3d.js` `render/tank3d.js` `sea3d.js` `ui/camera-fly.js` `ui/hud.js` `ui/landbar.js` `ui/race-dev.js` |
| `game/nature.js` | 57 | Dựng phần thiên nhiên của bể: bản đồ sáu đảo (render/map/), cầu (render/build/bridges3d.js, logic bắc cầu nào thì … | `BK.GameNature` G: 7 dịch vụ | `clouds3d.js` `game/world.js` `render/build/bridges3d.js` `render/deep3d.js` `render/map/map3d.js` `render/scene3d.js` `render/tank3d.js` `sea3d.js` |
| `game/seasons.js` | 41 | Bốn mùa: tên mùa, độ trộn giữa hai mùa (15 ngày đầu mùa trộn với mùa trước; năm đầu không trộn với mùa đông trước đó) … | `BK.GameSeasons` G: 1 dịch vụ | `game/nature.js` |
| `game/world.js` | 56 | Bộ nhớ chung của game (G) mà mọi tệp trong game/, render/ và ui/ cùng đọc: hàm tiện dụng, sáu vùng đất, trạng thái thế … | `BK.GameWorld` G: 15 dịch vụ | `audio.js` |

## logic/

Logic ngầm (chạy được trong Node, không vẽ): người, đảo, kinh tế, chiến tranh, quyền năng.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `logic/arms.js` | 203 | Vũ khí qua từng thời … | `BK.Arms` | `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/siege.js` `logic/war.js` |
| `logic/battles.js` | 363 | Kịch bản chiến tranh … | `BK.Battles` | `logic/chronicle.js` `logic/diplomacy.js` `logic/ecology.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/schedule.js` `logic/siege.js` `logic/strategy.js` `logic/war.js` `logic/world.js` |
| `logic/brain.js` | 251 | Bộ não tình huống: đọc tình huống của đảo (hạn hán, lệnh chiến tranh, lễ hội, cãi nhau, tang) và gen của từng người … | `BK.Brain` | `logic/battles.js` `logic/climate.js` `logic/dramas.js` `logic/ecology.js` `logic/genes.js` `logic/people.js` `logic/rules.js` `logic/scenes.js` `logic/schedule.js` `logic/siege.js` `logic/tasks.js` |
| `logic/chronicle.js` | 267 | Biên niên, nhân vật nổi bật, nhịp kịch tính … | `BK.Chronicle` | `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/rules.js` `logic/strategy.js` |
| `logic/climate.js` | 148 | Khí hậu và thiên tai của từng đảo (hệ thống tự sinh) | `BK.Climate` | `logic/island.js` `logic/people.js` `logic/rules.js` |
| `logic/construction.js` | 90 | Dựng công trình trong mỗi thời | `BK.Construction` | `logic/eras.js` `logic/rules.js` `logic/schedule.js` |
| `logic/council.js` | 121 | Hội đồng 8 ghế của một đảo: vua, hai tướng, quân sư, tư tế, thương chủ, thầy thuốc, thợ cả | `BK.Council` | `logic/people.js` `logic/rules.js` |
| `logic/diplomacy.js` | 522 | Quan hệ giữa các đảo, giao thương, hiệp ước, cầu … | `BK.Diplomacy` | `logic/ecology.js` `logic/economy.js` `logic/island.js` `logic/people.js` |
| `logic/dramas.js` | 417 | Drama trong thành phố … | `BK.Dramas` | `logic/people.js` `logic/posts.js` `logic/rules.js` `logic/schedule.js` `logic/temper.js` |
| `logic/ecology.js` | 526 | Bể kính là một hệ sinh thái hỗn loạn … | `BK.Ecology` | `logic/brain.js` `logic/chronicle.js` `logic/climate.js` `logic/council.js` `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/posts.js` `logic/rules.js` `logic/strategy.js` `logic/war.js` |
| `logic/economy.js` | 257 | Tài nguyên, sản xuất, kho và lên cấp của một đảo … | `BK.Economy` | `logic/battles.js` `logic/climate.js` `logic/ecology.js` `logic/eras.js` `logic/island.js` `logic/missiles.js` `logic/people.js` `logic/powers.js` `logic/prosperity.js` `logic/rules.js` `logic/siege.js` |
| `logic/epigen.js` | 101 | Ngoại gen: nghịch cảnh để lại dấu lên tính cách … | `BK.Epigen` | `logic/climate.js` `logic/people.js` |
| `logic/eras.js` | 138 | Mười hai thời kỳ văn minh của một trận chín năm | `BK.Eras` | `logic/rules.js` |
| `logic/family.js` | 181 | Mỗi mốc thế hệ (1,5 năm): ghép đôi người còn sống chưa có vợ chồng, rồi mỗi cặp sinh 1 tới 3 con mang gen lai | `BK.Family` | `logic/epigen.js` `logic/genes.js` `logic/people.js` `logic/rules.js` |
| `logic/genes.js` | 136 | Bộ gen của một người: 8 gen tính cách, 4 gen dáng, 1 thói quen khi đứng chờ, và có thể một gen hiếm | `BK.Genes` |  |
| `logic/goals.js` | 60 | Mục tiêu theo trận cho người chơi … | `BK.Goals` | `logic/eras.js` `logic/island.js` |
| `logic/guards.js` | 123 | Kịch bản của lính gác cổng … | `BK.Guards` | `logic/climate.js` `logic/people.js` `logic/posts.js` `logic/temper.js` |
| `logic/homes.js` | 74 | Nhà riêng của từng hộ | `BK.Homes` | `logic/people.js` `logic/rules.js` |
| `logic/island.js` | 239 | Trạng thái của một đảo và nhịp chạy theo ngày: 8 người đầu tiên, hội đồng, tuổi và cái chết, mốc thế hệ mỗi 1,5 năm … | `BK.Island` | `logic/brain.js` `logic/climate.js` `logic/construction.js` `logic/council.js` `logic/dramas.js` `logic/economy.js` `logic/epigen.js` `logic/eras.js` `logic/family.js` `logic/genes.js` `logic/homes.js` `logic/jobs.js` `logic/people.js` `logic/rng.js` `logic/rules.js` `logic/scenes.js` `logic/siege.js` |
| `logic/jobs.js` | 96 | Việc của người không ngồi trong hội đồng, chọn theo tính cách: vị trí cứng (logic/posts.js: gác cổng chính, cổng phụ, diễn … | `BK.Jobs` | `logic/people.js` `logic/posts.js` `logic/rules.js` `logic/temper.js` |
| `logic/leader.js` | 211 | Kịch bản của người đứng đầu đảo … | `BK.Leader` | `logic/climate.js` `logic/economy.js` `logic/people.js` `logic/temper.js` |
| `logic/missiles.js` | 364 | Tên lửa (từ thời 7) và hạt nhân (từ thời 8) | `BK.Missiles` | `logic/battles.js` `logic/chronicle.js` `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/siege.js` `logic/strategy.js` `logic/war.js` |
| `logic/people.js` | 156 | Một người có tên: gia tộc, giới tính, ngày sinh, cha mẹ, vợ chồng, con cái, bộ gen, vai trong hội đồng | `BK.People` | `logic/rules.js` |
| `logic/posts.js` | 122 | Vị trí cứng (kịch bản cố định của thành phố) | `BK.Posts` | `logic/people.js` `logic/rules.js` |
| `logic/powers.js` | 119 | Quyền năng có giá của người ngoài bể … | `BK.Powers` | `logic/chronicle.js` `logic/climate.js` `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/rules.js` `logic/siege.js` `logic/war.js` |
| `logic/prosperity.js` | 257 | Thịnh vượng và suy tàn thấy được … | `BK.Prosperity` | `logic/chronicle.js` `logic/climate.js` `logic/diplomacy.js` `logic/dramas.js` `logic/economy.js` `logic/eras.js` `logic/island.js` `logic/people.js` `logic/strategy.js` |
| `logic/rng.js` | 48 | Số ngẫu nhiên có hạt giống: cùng một hạt giống thì cả trận diễn ra y hệt (để kiểm thử và chơi lại) | `BK.Rng` |  |
| `logic/rules.js` | 60 | Mọi con số luật chơi của logic ngầm nằm ở đây, để chỉnh nhịp trận mà không phải tìm trong từng tệp | `BK.Rules` |  |
| `logic/save.js` | 134 | Lưu và nạp lại cả trận … | `BK.Save` | `logic/rng.js` |
| `logic/scenes.js` | 139 | Cảnh theo sự kiện của một đảo … | `BK.Scenes` | `logic/people.js` `logic/posts.js` |
| `logic/schedule.js` | 29 | Lịch một ngày theo giờ trong ngày (S.tod, 0..1, do phần chạy game ghi vào theo vòng ngày đêm trên trời): đêm, sáng, trưa … | `BK.Schedule` |  |
| `logic/siege.js` | 321 | Đánh thành: cổng → các công trình xung quanh → nhà chính … | `BK.Siege` | `logic/economy.js` `logic/island.js` `logic/people.js` `logic/rules.js` |
| `logic/strategy.js` | 536 | Não chiến lược của người đứng đầu mỗi đảo … | `BK.Strategy` | `logic/chronicle.js` `logic/diplomacy.js` `logic/ecology.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/war.js` |
| `logic/tasks.js` | 263 | Việc làm trong ngày thường theo vai và theo buổi (logic/schedule.js) | `BK.Tasks` | `logic/guards.js` `logic/leader.js` `logic/people.js` `logic/posts.js` `logic/schedule.js` `logic/siege.js` |
| `logic/temper.js` | 56 | Tính cách nổi trội của một người … | `BK.Temper` |  |
| `logic/war.js` | 1513 | Chiến tranh, sáp nhập, nổi dậy … | `BK.War` `BK.WarFront` | `logic/arms.js` `logic/battles.js` `logic/chronicle.js` `logic/climate.js` `logic/construction.js` `logic/council.js` `logic/diplomacy.js` `logic/dramas.js` `logic/economy.js` `logic/eras.js` `logic/island.js` `logic/missiles.js` `logic/people.js` `logic/rules.js` `logic/siege.js` `logic/strategy.js` |
| `logic/world.js` | 125 | Cả bể: sáu đảo, một đồng hồ … | `BK.World` | `logic/chronicle.js` `logic/diplomacy.js` `logic/ecology.js` `logic/goals.js` `logic/island.js` `logic/powers.js` `logic/prosperity.js` `logic/rng.js` `logic/strategy.js` `logic/war.js` |

## render/

Vẽ 3D: người, làng, trận đánh, trời, đáy bể.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/anim3d.js` | 250 | Cử động tay chân bằng công thức, không cần tệp hoạt ảnh: 5 trạng thái gốc (đứng yên, đi, nói chuyện hay tranh cãi … | `BK.Anim3D` | `render/ik3d.js` |
| `render/buildings3d.js` | 1485 | Đặt công trình lên cả sáu đảo theo cấp văn minh (1..12) | `BK.Buildings3D` G: 1 dịch vụ | `render/build/batch3d.js` `render/build/isles/compose.js` `render/build/kit3d.js` `render/build/life3d.js` `render/build/neon.js` `render/build/place3d.js` `render/build/plains/common.js` `render/build/roads.js` `render/build/ruins3d.js` `render/build/traffic3d.js` `render/build/workyards3d.js` `render/look3d.js` `sea3d.js` |
| `render/deep3d.js` | 247 | Đáy bể: ghép các phần, rong, bọt khí, máy quay dưới nước … | `BK.Deep3D` | `render/deep/citadel3d.js` `render/deep/denizens3d.js` `render/deep/kit3d.js` `render/deep/ruins3d.js` `render/deep/terrain3d.js` `render/deep/tunnels3d.js` |
| `render/engines3d.js` | 310 | Máy công thành, trại vây, cổng dịch chuyển, lá chắn … | `BK.Engines3D` | `render/map/map3d.js` |
| `render/gestures3d.js` | 629 | Thư viện cử chỉ của NPC trong toàn bộ Chaos Sandbox: di chuyển, đứng chờ, giao tiếp, cảm xúc, lao động, tôn giáo … | `BK.Gestures3D` G: 2 dịch vụ |  |
| `render/hpbars3d.js` | 72 | Thanh máu … | `BK.HpBars3D` |  |
| `render/ik3d.js` | 100 | Tay tự tìm đúng chỗ chạm trên cơ thể (IK hai khúc: bắp tay, cẳng tay): chống hông, chống cằm, chắp tay, khoanh tay … | `BK.IK3D` |  |
| `render/look3d.js` | 250 | Hình ảnh "mô hình thu nhỏ" … | `BK.Look3D` G: 1 dịch vụ | `game/cities.js` `game/nature.js` |
| `render/missiles3d.js` | 191 | Tên lửa bay, vụ nổ, nấm hạt nhân … | `BK.Missiles3D` | `render/map/map3d.js` |
| `render/mood3d.js` | 109 | Không khí ánh sáng ("chill") | `BK.Mood3D` |  |
| `render/nav3d.js` | 598 | Lối đi của người trên một đảo … | `BK.NAV_SOLIDS` `BK.Nav3D` | `render/build/plains/common.js` `render/build/roads.js` |
| `render/neon3d.js` | 272 | Mặt trời nhân tạo của thành phố neon (từ thời 10) | `BK.NeonCity3D` G: 1 dịch vụ | `game/cities.js` `game/nature.js` `render/build/neon.js` `render/scene3d.js` |
| `render/outfits3d.js` | 262 | Trang phục của 5 nhóm người hay gặp qua 12 thời kỳ: người đứng đầu, tướng, lính, dân thường nam, dân thường nữ | `BK.Outfits3D` |  |
| `render/perf3d.js` | 139 | Mượt và nét: bộ điều tốc nhắm 60 khung hình mỗi giây (chậm thì hạ độ nét, vẽ bóng thưa hơn, rồi bỏ bóng; nhanh lại thì … | `BK.Perf3D` G: 1 dịch vụ | `game/world.js` |
| `render/prosper3d.js` | 304 | Thịnh vượng và suy tàn thấy được … | `BK.Prosper3D` | `sea3d.js` |
| `render/rig3d.js` | 468 | Bộ khung khớp của một người (hông, ngực, cổ, đầu, vai, khuỷu, cổ tay, hông, gối, cổ chân) và hình người theo nét đã … | `BK.Rig3D` | `render/outfits3d.js` |
| `render/scene3d.js` | 125 | Bộ vẽ, cảnh, camera và tay kéo xoay camera, đổi cỡ màn hình; vài thứ dùng chung khi vẽ: ảnh đốm sáng mờ (glowTex), vật … | `BK.Scene3D` G: 11 dịch vụ | `render/mood3d.js` |
| `render/shots3d.js` | 210 | Tên, đạn, tia bay trên chiến trường … | `BK.Shots3D` |  |
| `render/sky3d.js` | 222 | Bầu trời, sao, trăng, ánh sáng (trời, nắng, trăng) và ngày đêm: mỗi khung hình tính màu trời theo giờ (G.time.tod) … | `BK.Sky3D` G: 2 dịch vụ | `game/cities.js` `game/world.js` `render/build/neon.js` `render/look3d.js` `render/mood3d.js` `render/perf3d.js` |
| `render/snow3d.js` | 51 | Tuyết rơi mùa đông trên băng nguyên (dày) và núi (thưa), dày dần theo độ đông (G.weather.winter) | `BK.Snow3D` G: 1 dịch vụ | `game/world.js` `render/map/map3d.js` |
| `render/tank3d.js` | 61 | Bể kính bao quanh sáu đảo: vòm kính trong, vòng đồng ở chân, các núm đồng; đá trôi lơ lửng bên ngoài bể (nhấp nhô) | `BK.Tank3D` G: 2 dịch vụ | `render/map/map3d.js` |
| `render/travel3d.js` | 231 | Đoàn buôn đi giữa các đảo … | `BK.Travel3D` | `sea3d.js` |
| `render/village3d.js` | 1627 | Người của một làng trên đảo: mỗi người một khung khớp (render/rig3d.js, nét vẽ đã chốt, trang phục theo thời và nhóm) … | `BK.Village3D` | `logic/arms.js` `logic/brain.js` `logic/island.js` `logic/people.js` `render/anim3d.js` `render/gestures3d.js` `render/nav3d.js` `render/rig3d.js` `render/shots3d.js` `render/work3d.js` |
| `render/war3d.js` | 249 | Quân đi đánh, vây cổng, cờ của đảo cai quản … | `BK.War3D` | `render/map/map3d.js` |
| `render/work3d.js` | 344 | Hai thứ tách bạch (design/npc-song-that.md mục 2, 3, 7.1) … | `BK.Work3D` | `render/gestures3d.js` |

## render/map/

Bản đồ sáu đảo: dáng đất, cao độ, nước, núi, cây.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/map/height3d.js` | 595 | Cao độ mặt đảo (đảo nhấp nhô như đảo thật; design/ke-hoach-buoc-14.md) | `BK.MapHeight` |  |
| `render/map/map3d.js` | 124 | bản đồ sáu đảo (chỉ thiên nhiên) | `BK.groundAt` `Lands3D` | `render/map/height3d.js` `render/map/mountains3d.js` `render/map/relief3d.js` `render/map/shared3d.js` `render/map/terrain3d.js` `render/map/trees3d.js` `render/map/water3d.js` |
| `render/map/mountains3d.js` | 322 | Núi của bản đồ | `BK.MapMountains` |  |
| `render/map/relief3d.js` | 459 | Địa hình thêm của từng đảo, đặt ngoài vùng làng ở giữa đảo: khối núi riêng (MASSIF ở mountains3d.js), sông chảy từ mép … | `BK.MapRelief` |  |
| `render/map/shared3d.js` | 315 | Phần dùng chung của bản đồ: hình học gốc dùng lại (hộp, trụ, nón, khối nhiều mặt...), bộ gom mảnh Kit (mỗi mảnh một màu … | `BK.MapShared` | `render/look3d.js` |
| `render/map/terrain3d.js` | 815 | Dáng đất riêng của sáu miền: mép đảo (shapeOf), phần đất đá phía dưới đảo (underside), mặt đảo, hồ và sông sẵn có của … | `BK.MapTerrain` | `render/build/roads.js` |
| `render/map/trees3d.js` | 433 | Cây và bụi của sáu miền (FLORA): cây tán tròn ít mặt mọc thành lùm, giữ lại thông, thông tuyết, dừa, xương rồng … | `BK.MapTrees` |  |
| `render/map/water3d.js` | 61 | Gộp mặt nước và bờ của một đảo: mỗi loại một khối, một lượt vẽ (màu theo đỉnh, giữ nguyên chỗ và dáng) | `BK.MapWater` |  |

## render/deep/

Đáy bể: địa hình, phế tích, đường hầm (ghép ở render/deep3d.js).

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/deep/beings3d.js` | 829 | Dựng hình và cử động của sinh vật đáy bể: 5 loài NPC biến dị, 3 loài quái vật biển … | `BK.DeepBeings` |  |
| `render/deep/citadel3d.js` | 669 | Thành Vỏ Ốc Xà Cừ: phế tích trong rãnh dưới Thông Xanh … | `BK.DeepCitadel` |  |
| `render/deep/denizens3d.js` | 815 | Sinh vật sống dưới đáy bể: chỗ ở, nếp sống, cảnh báo kẻ địch … | `BK.DeepDenizens` | `render/deep/beings3d.js` |
| `render/deep/kit3d.js` | 90 | Bộ ghép khối của đáy bể: hình gốc (hộp, trụ, nón, …), ba nhóm gộp (đá, đá sáng, rong), put (đặt một khối … | `BK.DeepKit` |  |
| `render/deep/ruins3d.js` | 484 | Hai phế tích dưới đáy bể … | `BK.DeepRuins` |  |
| `render/deep/terrain3d.js` | 400 | Địa hình đáy bể … | `BK.DeepTerrain` |  |
| `render/deep/tunnels3d.js` | 445 | Ba đường hầm xuyên ba núi trụ nối ba phế tích … | `BK.DeepTunnels` |  |

## render/build/

Công trình dùng chung mọi đảo: bộ ghép khối, đường, cổng, cầu, xe, kỳ quan.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/build/batch3d.js` | 123 | Gộp công trình của một đảo thành ít khối để máy nhẹ khi nhìn từ xa: mọi phần đứng yên của các công trình đang hiện gộp … | `BK.Batch3D` |  |
| `render/build/bridges3d.js` | 364 | Cầu nối hai đảo kề nhau, dáng đổi theo thời (cầu treo, gỗ, đá, sắt, dây văng, cầu ánh sáng...) | `BK.Bridges3D` |  |
| `render/build/civic.js` | 562 | Công trình công cộng của sáu đảo … | `BK.Civic3D` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/gates.js` | 405 | Cổng thành của sáu đảo qua 12 thời (72 cổng) | `BK.Gates3D` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/kit3d.js` | 360 | Bộ dựng hình chung cho mọi công trình, vẽ theo cách của đảo: mặt phẳng (flat shading), góc vát một lớp, màu theo đỉnh … | `BK.BuildKit` | `render/look3d.js` |
| `render/build/lamps.js` | 189 | Đèn đường qua các thời (thời 1 tới 9, cả sáu đảo) | `BK.Lamps3D` | `render/build/kit3d.js` `render/build/plains/common.js` `render/build/roads.js` |
| `render/build/life3d.js` | 62 | Khói bốc lên từ công trình (bếp lửa, ống khói, lò rèn, nhà máy) | `BK.Life3D` |  |
| `render/build/marvels.js` | 1520 | Kiến trúc lạ của sáu đảo qua 12 thời … | `BK.Marvels3D` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/neon.js` | 92 | Thành phố neon (từ thời 10) | `BK.Neon3D` | `render/build/kit3d.js` `render/build/plains/common.js` `render/build/roads.js` |
| `render/build/place3d.js` | 320 | Tìm chỗ đặt công trình trên địa hình thật của một đảo (tránh núi, hồ, sông, mép đảo và các công trình khác) … | `BK.Place3D` |  |
| `render/build/roads.js` | 274 | Mạng đường của sáu đảo … | `BK.Roads3D` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/ruins3d.js` | 122 | Công trình hư hại trong chiến tranh … | `BK.Ruins3D` | `render/build/life3d.js` |
| `render/build/traffic3d.js` | 522 | Xe chạy trên vòng đường và nhường người đi bộ … | `BK.Traffic3D` | `render/build/plains/common.js` |
| `render/build/vehicles.js` | 282 | Xe cộ của từng thời … | `BK.Vehicles3D` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/workyards3d.js` | 294 | Bãi làm việc của một đảo … | `BK.WorkYards3D` | `render/build/place3d.js` |

## render/build/plains/

Công trình Lúa Vàng theo 12 thời.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/build/plains/common.js` | 213 | Phần dùng chung cho công trình đảo Lúa Vàng: bảng màu, chỗ đặt nhà quanh làng, 20 nhà riêng của dân (homes), và những món dùng lại qua nhiều thời … | `BK.Plains3D` | `render/build/isles/arch.js` `render/build/kit3d.js` |
| `render/build/plains/e01.js` | 198 | Cấp 1, Thời đồ đá (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e02.js` | 208 | Cấp 2, Cổ đại (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e03.js` | 148 | Cấp 3, Trung đại (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e04.js` | 161 | Cấp 4, Cận đại (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e05.js` | 141 | Cấp 5, Công nghiệp (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e06.js` | 155 | Cấp 6, Hiện đại (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e07.js` | 198 | Cấp 7, Tên lửa (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e08.js` | 148 | Cấp 8, Robot AI (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e09.js` | 160 | Cấp 9, Vật Chất Sống (Lúa Vàng) · thời vượt người … |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e10.js` | 153 | Cấp 10, Mặt Trời Nhân Tạo (Lúa Vàng) · thời vượt người … |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e11.js` | 121 | Cấp 11, Bẻ Cong Không Gian (Lúa Vàng) · thời vượt người … |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/e12.js` | 107 | Cấp 12, Siêu Việt (Lúa Vàng) · thời vượt người … |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/outer.js` | 453 | Công trình ngoài làng của Lúa Vàng (mọi thời) |  | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/plains/town.js` | 333 | Làng lớn dần qua các thời (Lúa Vàng) |  | `render/build/kit3d.js` `render/build/lamps.js` `render/build/neon.js` `render/build/plains/common.js` `render/build/roads.js` `render/build/vehicles.js` |
| `render/build/plains/wonders.js` | 415 | Mười hai kỳ quan của Lúa Vàng (mỗi thời một) |  | `render/build/kit3d.js` `render/build/plains/common.js` |

## render/build/isles/

Công trình năm đảo còn lại.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `render/build/isles/arch.js` | 1345 | Bộ kiểu kiến trúc chung cho năm đảo (Thông Xanh, Đá Mây, Tuyết Trắng, Cửa Sóng … | `BK.IslesArch` | `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/isles/coast.js` | 36 | Cửa Sóng (Biển): kiến trúc 12 thời … |  | `render/build/isles/compose.js` |
| `render/build/isles/compose.js` | 171 | Ghép bố cục 12 thời cho năm đảo … | `BK.Isles3D` `BK.IslesCompose` | `render/build/civic.js` `render/build/gates.js` `render/build/isles/arch.js` `render/build/isles/halls.js` `render/build/marvels.js` `render/build/plains/common.js` |
| `render/build/isles/desert.js` | 36 | Cát Hồng (Sa mạc): kiến trúc 12 thời … |  | `render/build/isles/compose.js` |
| `render/build/isles/forest.js` | 36 | Thông Xanh (Rừng): kiến trúc 12 thời … |  | `render/build/isles/compose.js` |
| `render/build/isles/halls-future.js` | 900 | Nhà chính thời 7 đến 12 của năm đảo (30 công trình) | `BK.IslesHallsFuture` | `render/build/isles/arch.js` `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/isles/halls.js` | 378 | Nhà chính của năm đảo, lên cấp đều qua 12 thời … | `BK.IslesHalls` | `render/build/isles/arch.js` `render/build/isles/halls-future.js` `render/build/kit3d.js` `render/build/plains/common.js` |
| `render/build/isles/mountain.js` | 36 | Đá Mây (Núi): kiến trúc 12 thời … |  | `render/build/isles/compose.js` |
| `render/build/isles/tundra.js` | 36 | Tuyết Trắng (Băng nguyên): kiến trúc 12 thời … |  | `render/build/isles/compose.js` |

## ui/

Giao diện: thanh đảo, bảng làng, máy quay bay, bảng dev.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `ui/camera-fly.js` | 146 | Camera đi theo tay người chơi: bay tới một chỗ (flyTo, trượt êm), bay tự do bằng phím mũi tên, W A S D, Q E (lên xuống) | `BK.CameraFly` G: 2 dịch vụ | `game/nature.js` `game/world.js` `render/map/map3d.js` `render/tank3d.js` `ui/landbar.js` |
| `ui/hud.js` | 62 | Những gì ghi và bấm trên màn hình ngoài bảng làng: nút tốc độ (1×, 2×, 4×; không có tạm dừng), nút âm thanh, dòng ngày … | `BK.Hud` G: 1 dịch vụ | `game/cities.js` `game/seasons.js` `game/world.js` `logic/eras.js` |
| `ui/landbar.js` | 59 | Thanh sáu vùng đất ở trên cùng: bấm một đảo để bay tới đảo đó; đảo đang xem được tô sáng (setFocus) | `BK.LandBar` G: 1 dịch vụ | `game/nature.js` `game/world.js` `ui/camera-fly.js` |
| `ui/race-dev.js` | 277 | Tin giữa các đảo và bảng dev "Cuộc đua" … | `BK.RaceDev` G: 1 dịch vụ | `game/cities.js` `game/nature.js` `game/world.js` `logic/chronicle.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/temper.js` `logic/war.js` `ui/camera-fly.js` `ui/landbar.js` |
| `ui/village-ui.js` | 346 | Bảng của một làng: thế hệ, số người, tình huống đang có, hội đồng 8 ghế, nhật ký, và các nút thử tình huống … | `BK.VillageUI` | `logic/brain.js` `logic/council.js` `logic/dramas.js` `logic/eras.js` `logic/genes.js` `logic/homes.js` `logic/jobs.js` `logic/people.js` `logic/rules.js` `logic/tasks.js` `logic/temper.js` |

## test/

Kiểm thử: node --test test/*.js.

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `test/battles.test.js` | 407 | Bước 8: vũ khí theo thời (logic/arms.js), kịch bản chiến tranh (logic/battles.js) … |  | `logic/arms.js` `logic/battles.js` `logic/brain.js` `logic/chronicle.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/prosperity.js` `logic/schedule.js` `logic/siege.js` `logic/war.js` `logic/world.js` |
| `test/bridges.test.js` | 150 | Cầu do người đứng đầu quyết, xây thật, phá cầu; người qua lại (logic/diplomacy.js, logic/strategy.js) |  | `logic/diplomacy.js` `logic/economy.js` `logic/epigen.js` `logic/island.js` `logic/schedule.js` `logic/war.js` `logic/world.js` |
| `test/climate.test.js` | 110 | Khí hậu, thiên tai từng đảo và ngoại gen … |  | `logic/brain.js` `logic/climate.js` `logic/epigen.js` `logic/genes.js` `logic/island.js` `logic/people.js` `logic/rng.js` `logic/world.js` |
| `test/code.test.js` | 50 | Giữ quy ước code dễ tìm, dễ sửa (README.md mục "Làm việc với code") |  |  |
| `test/ecology.test.js` | 236 | Hệ sinh thái hỗn loạn (logic/ecology.js): môi trường, chạy nạn, lấy vợ chồng khác đảo … |  | `logic/brain.js` `logic/climate.js` `logic/diplomacy.js` `logic/ecology.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/schedule.js` `logic/tasks.js` `logic/world.js` |
| `test/economy.test.js` | 97 | Tài nguyên và lên cấp: mỗi đảo một nhịp, thiếu thứ gì thì kẹt ở đó (khi chưa có giao thương) |  | `logic/economy.js` `logic/family.js` `logic/island.js` `logic/world.js` |
| `test/eras.test.js` | 21 | Mười hai thời kỳ: thời đầu là Thời đồ đá; lên cấp bằng giỏ tài nguyên (logic/economy.js) |  |  |
| `test/helpers.js` | 34 | Dùng chung cho các tệp kiểm thử (không phải tệp kiểm thử) |  | `logic/diplomacy.js` `logic/strategy.js` `logic/war.js` |
| `test/island.test.js` | 356 | Kiểm thử logic ngầm của một đảo (Lúa Vàng): chạy bằng `node --test` trong thư mục aquarium |  | `logic/brain.js` `logic/dramas.js` `logic/homes.js` `logic/island.js` `logic/jobs.js` `logic/people.js` `logic/posts.js` `logic/rules.js` `logic/schedule.js` `logic/temper.js` |
| `test/missiles.test.js` | 186 | Tên lửa (thời 7), hạt nhân (thời 8) (logic/missiles.js) |  | `logic/economy.js` `logic/island.js` `logic/missiles.js` `logic/people.js` `logic/siege.js` `logic/war.js` `logic/world.js` |
| `test/powers.test.js` | 141 | Quyền năng có giá, mục tiêu theo trận (logic/powers.js, logic/goals.js; design/ke-hoach-khac-phuc.md mục 8) |  | `logic/climate.js` `logic/economy.js` `logic/eras.js` `logic/goals.js` `logic/island.js` `logic/powers.js` `logic/siege.js` `logic/world.js` |
| `test/save.test.js` | 84 | Lưu và nạp lại trận (logic/save.js) |  | `logic/economy.js` `logic/island.js` `logic/save.js` `logic/world.js` |
| `test/scenes.test.js` | 147 | Cảnh theo sự kiện (logic/scenes.js), cảnh đói (logic/tasks.js) |  | `logic/economy.js` `logic/island.js` `logic/posts.js` `logic/schedule.js` `logic/world.js` |
| `test/siege.test.js` | 224 | Đánh thành (logic/siege.js, logic/war.js): cổng theo đường tới, công trình hư, vây nhà chính … |  | `logic/battles.js` `logic/brain.js` `logic/dramas.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/schedule.js` `logic/siege.js` `logic/war.js` `logic/world.js` |
| `test/strategy.test.js` | 227 | Người đứng đầu, quan hệ giữa các đảo, giao thương, hiệp ước, cầu … |  | `logic/diplomacy.js` `logic/economy.js` `logic/epigen.js` `logic/missiles.js` `logic/strategy.js` `logic/world.js` |
| `test/war.test.js` | 269 | Chiến tranh, sáp nhập, nổi dậy (logic/war.js, quyết định ở logic/strategy.js) |  | `logic/diplomacy.js` `logic/economy.js` `logic/island.js` `logic/people.js` `logic/siege.js` `logic/war.js` `logic/world.js` |
| `test/world.test.js` | 117 | Cả bể: sáu đảo có dân, một đồng hồ, kết quả không phụ thuộc tốc độ chạy … |  | `logic/island.js` `logic/people.js` `logic/posts.js` `logic/world.js` |

## tools/

Công cụ đo, quét lỗi, đóng gói (chạy tay).

| Tệp | Dòng | Việc | Tạo ra | Dùng |
|---|---|---|---|---|
| `tools/bug-hunt.js` | 398 | Quét lỗi trận chiến và NPC bằng trình duyệt không giao diện … | `BK.NAV_SOLIDS` | `game/cities.js` `game/nature.js` `game/world.js` `logic/arms.js` `logic/economy.js` `logic/island.js` `logic/strategy.js` `logic/war.js` `logic/world.js` `render/nav3d.js` `render/scene3d.js` `ui/landbar.js` |
| `tools/calibrate.js` | 221 | Cân chỉnh bằng nhiều trận … |  | `logic/island.js` `logic/world.js` |
| `tools/check-footing.js` | 73 | Quét công trình thò ra ngoài đảo: 6 đảo × 12 thời … |  | `game/cities.js` `game/world.js` |
| `tools/check-scene.js` | 175 | Kiểm tra cảnh bằng trình duyệt không giao diện … |  | `game/cities.js` `game/nature.js` `game/world.js` `logic/dramas.js` `logic/world.js` `render/build/place3d.js` `render/scene3d.js` |
| `tools/check-walk.js` | 187 | Người đi xuyên công trình: 6 đảo × 12 thời … |  | `game/cities.js` `game/nature.js` `game/world.js` `logic/world.js` `render/build/kit3d.js` `render/scene3d.js` |
| `tools/clip.js` | 376 | Quay clip khung dọc điện thoại để xem bằng mắt … |  | `game/cities.js` `game/nature.js` `game/world.js` `logic/economy.js` `logic/island.js` `logic/strategy.js` `logic/war.js` `logic/world.js` `render/perf3d.js` `render/scene3d.js` `ui/landbar.js` |
| `tools/code-map.js` | 174 | Lập bản đồ mã nguồn MA-NGUON.md (tự sinh từ code: đừng sửa tay tệp đó) | `BK.X` `X` |  |
| `tools/scene-print.js` | 106 | Dấu vân tay hình học của cảnh: dùng khi dọn hay tách code để chắc hình vẽ không đổi … |  | `game/cities.js` `game/nature.js` `game/world.js` `render/scene3d.js` |

## Dịch vụ G (tên → tệp tạo ra)

Đối tượng G là bộ nhớ chung của game trên trang (game/loop.js lập, mỗi tệp `setup(G)` thêm dịch vụ của mình).

- `render/look3d.js`: `G.look`
- `render/gestures3d.js`: `G.face`, `G.closed`
- `render/buildings3d.js`: `G.visible`
- `game/world.js`: `G.THREE`, `G.reduce`, `G.hash`, `G.clamp`, `G.lerp`, `G.C`, `G.audio`, `G.typing`, `G.touchUi`, `G.TERRAINS`, `G.W`, `G.Sim`, `G.focus`, `G.time`, `G.weather`
- `render/scene3d.js`: `G.canvas`, `G.renderer`, `G.scene`, `G.camera`, `G.controls`, `G.resize`, `G.mat`, `G.mesh`, `G.glowTex`, `G.puff`, `G.updatePuffs`
- `render/sky3d.js`: `G.sun`, `G.sky`
- `render/neon3d.js`: `G.neonCity`
- `render/perf3d.js`: `G.perf`
- `render/tank3d.js`: `G.DOME`, `G.tank`
- `game/nature.js`: `G.lands3d`, `G.lands`, `G.bridges3d`, `G.sea3d`, `G.deep3d`, `G.clouds3d`, `G.nature`
- `game/seasons.js`: `G.seasons`
- `render/snow3d.js`: `G.snow`
- `ui/camera-fly.js`: `G.flyTo`, `G.cameraFly`
- `ui/landbar.js`: `G.setFocus`
- `ui/race-dev.js`: `G.raceDev`
- `game/cities.js`: `G.world`, `G.isle`, `G.buildings`, `G.prosper`, `G.shots`, `G.deckAt`, `G.villages`, `G.war3d`, `G.travel3d`, `G.village`, `G.villageUi`, `G.villageOf`, `G.jumpEra`, `G.goEra`, `G.citiesRun`, `G.animate`, `G.slow`, `G.levelOf`, `G.shots3d`, `G.skyLevel`, `G.level`, `G.watchIsland`, `G.slowmo`, `G.topStory`, `G.gearNow`, `G.dust`
- `ui/hud.js`: `G.hud`
- `game/loop.js`: `G.frameTime`

## Thứ tự nạp trong index.html

Tệp sau dùng được những gì tệp trước tạo ra. Thêm tệp mới: đặt sau mọi tệp nó dùng.

1. `audio.js`
2. `render/look3d.js`
3. `render/map/shared3d.js`
4. `render/map/mountains3d.js`
5. `render/map/height3d.js`
6. `render/map/terrain3d.js`
7. `render/map/water3d.js`
8. `render/map/relief3d.js`
9. `render/map/trees3d.js`
10. `render/map/map3d.js`
11. `sea3d.js`
12. `render/deep/terrain3d.js`
13. `render/deep/kit3d.js`
14. `render/deep/citadel3d.js`
15. `render/deep/ruins3d.js`
16. `render/deep/tunnels3d.js`
17. `render/deep/beings3d.js`
18. `render/deep/denizens3d.js`
19. `render/deep3d.js`
20. `clouds3d.js`
21. `logic/rng.js`
22. `logic/rules.js`
23. `logic/genes.js`
24. `logic/people.js`
25. `logic/family.js`
26. `logic/council.js`
27. `logic/temper.js`
28. `logic/posts.js`
29. `logic/jobs.js`
30. `logic/eras.js`
31. `logic/schedule.js`
32. `logic/scenes.js`
33. `logic/leader.js`
34. `logic/guards.js`
35. `logic/tasks.js`
36. `logic/dramas.js`
37. `logic/economy.js`
38. `logic/climate.js`
39. `logic/epigen.js`
40. `logic/construction.js`
41. `logic/homes.js`
42. `logic/brain.js`
43. `logic/island.js`
44. `logic/diplomacy.js`
45. `logic/siege.js`
46. `logic/arms.js`
47. `logic/missiles.js`
48. `logic/ecology.js`
49. `logic/war.js`
50. `logic/battles.js`
51. `logic/chronicle.js`
52. `logic/prosperity.js`
53. `logic/strategy.js`
54. `logic/powers.js`
55. `logic/goals.js`
56. `logic/world.js`
57. `logic/save.js`
58. `render/outfits3d.js`
59. `render/rig3d.js`
60. `render/anim3d.js`
61. `render/ik3d.js`
62. `render/gestures3d.js`
63. `render/work3d.js`
64. `render/nav3d.js`
65. `render/village3d.js`
66. `ui/village-ui.js`
67. `render/build/kit3d.js`
68. `render/build/life3d.js`
69. `render/build/place3d.js`
70. `render/build/workyards3d.js`
71. `render/build/ruins3d.js`
72. `render/build/batch3d.js`
73. `render/build/bridges3d.js`
74. `render/travel3d.js`
75. `render/war3d.js`
76. `render/missiles3d.js`
77. `render/shots3d.js`
78. `render/engines3d.js`
79. `render/prosper3d.js`
80. `render/hpbars3d.js`
81. `render/build/plains/common.js`
82. `render/build/plains/e01.js`
83. `render/build/plains/e02.js`
84. `render/build/plains/e03.js`
85. `render/build/plains/e04.js`
86. `render/build/plains/e05.js`
87. `render/build/plains/e06.js`
88. `render/build/plains/e07.js`
89. `render/build/plains/e08.js`
90. `render/build/plains/e09.js`
91. `render/build/plains/e10.js`
92. `render/build/plains/e11.js`
93. `render/build/plains/e12.js`
94. `render/build/plains/outer.js`
95. `render/build/plains/wonders.js`
96. `render/build/roads.js`
97. `render/build/lamps.js`
98. `render/build/neon.js`
99. `render/build/vehicles.js`
100. `render/build/traffic3d.js`
101. `render/build/plains/town.js`
102. `render/build/gates.js`
103. `render/build/isles/arch.js`
104. `render/build/civic.js`
105. `render/build/marvels.js`
106. `render/build/isles/halls.js`
107. `render/build/isles/halls-future.js`
108. `render/build/isles/compose.js`
109. `render/build/isles/forest.js`
110. `render/build/isles/mountain.js`
111. `render/build/isles/tundra.js`
112. `render/build/isles/coast.js`
113. `render/build/isles/desert.js`
114. `render/buildings3d.js`
115. `game/world.js`
116. `render/scene3d.js`
117. `render/mood3d.js`
118. `render/sky3d.js`
119. `render/neon3d.js`
120. `render/perf3d.js`
121. `render/tank3d.js`
122. `game/nature.js`
123. `game/seasons.js`
124. `render/snow3d.js`
125. `ui/camera-fly.js`
126. `ui/landbar.js`
127. `ui/race-dev.js`
128. `game/cities.js`
129. `ui/hud.js`
130. `game/loop.js`
