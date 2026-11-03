# Project test auto deploy

Ứng dụng Node.js 22, không cần database hay dependency bên ngoài. Trang chủ hiển thị phiên bản thực sự đang chạy, build/start time và deployment ID do host agent cấp. Trang tự kiểm tra mỗi 5 giây; không giả lập deploy thành công.

## Chạy thử local

```sh
npm ci
npm run build
npm start
```

Mở http://localhost:3100. `PORT` có thể thay đổi; PoRender sẽ truyền port 10000 khi deploy. `/health` là health check, `/api/version` trả metadata công khai. Local preview không có deployment ID và được ghi rõ trên trang.

## Đẩy lên GitHub

Tạo một repository GitHub **trống**, ví dụ `porender-auto-deploy-test`. Trong chính thư mục project mẫu đã giải nén/copy, chạy:

```sh
git init -b main
git add .
git commit -m "feat: add deploy test V1"
git remote add origin https://github.com/YOUR_USERNAME/porender-auto-deploy-test.git
git push -u origin main
```

Thay `YOUR_USERNAME` bằng tài khoản của bạn. Lệnh `git init` phải chạy trước `git add` để project độc lập với repository PoRender cha. Chỉ đẩy project mẫu này; không đẩy `.env`, account data hoặc toàn bộ mã PoRender. Bản export không có Git remote/token/metadata của project cha.

## Kết nối với PoRender

1. Mở http://localhost:3000 và đăng nhập tài khoản hiện có.
2. **Add host** → tạo enrollment token. Trong một terminal tại checkout PoRender, chạy `npm run agent:enroll -- --url http://localhost:3000`, nhập token vào prompt ẩn, rồi chạy `npm run agent:start`. Nếu đã có host, chỉ cần chạy agent và chờ Online/Ready. Giữ terminal agent đang chạy.
3. **Integrations → GitHub** → kết nối URL repository vừa tạo. Repo public không cần token. Token cho repo private nhập trực tiếp trong ô được che trên localhost.
4. Cấu hình webhook Push của GitHub bằng URL và one-time secret do PoRender hiển thị: content type `application/json`, bật SSL verification. **GitHub phải truy cập được webhook qua HTTPS từ Internet. `localhost:3000` không phải URL webhook công khai.** Lượt nghiệm thu trước dùng relay tạm đã dừng; project này không tự tạo tunnel hay webhook.
5. Nếu có HTTPS origin riêng cho webhook, đặt `GITHUB_WEBHOOK_BASE_URL` trong `.env` của **PoRender**, restart web/API rồi lấy URL webhook mới trên dashboard. Setting này chỉ đổi URL hiển thị, không tự tạo public ingress. Gateway có sẵn trong PoRender: `npm run dev:webhook -- --connection CONNECTION_UUID --upstream http://127.0.0.1:3001 --port 3080`. Chỉ public gateway này qua HTTPS; giữ URL và chữ ký đúng với connection đã chọn.
6. **Blueprints → New Blueprint** → chọn GitHub connection, branch `main`, path `render.yaml` → tạo plan → **Apply Blueprint** → chọn host Online → bật **Automatically sync future GitHub pushes** → Apply.
7. Chờ Syncs thành công và service `auto-deploy-demo` Live. Mở URL ứng dụng trong service (mặc định `http://SERVICE_ID.localhost:8080`, nếu agent dùng gateway port khác thì dùng URL được hiển thị). Trang phải hiện **V1** và deployment ID thật. Ứng dụng không có database để tránh làm chậm bài test.

Có thể tạo bằng **New → Web Service → Git Provider**: branch `main`, runtime Node, build command `npm ci --ignore-scripts --no-audit --no-fund && npm run build`, start `npm start`, port `10000`, health `/health`, bật auto deploy. Chỉ chọn một cách tạo để tránh hai service chạy cùng project.

## Test push V2

Trong project mẫu:

```sh
npm run set-version -- V2
git add version.json
git commit -m "test: auto deploy V2"
git push
```

Không bấm Manual Deploy/Manual Sync trong bài test này. Theo dõi GitHub connection có delivery mới, Blueprint Syncs/Service Deploys có commit mới. Sau khi Live, trang ứng dụng tự chuyển **V1 → V2** và deployment ID thay đổi. Instance logs có `event: started` với `version: V2` và đúng deployment ID. `/api/version` và HTTP header `x-app-version` giúp kiểm tra độc lập.

Tiếp tục với `npm run set-version -- V3` để test lần nữa. Thay đổi source tại máy local không đổi bản đang live; phải commit/push và deploy thành công.

## Test rollback và lỗi health (tùy chọn)

- Trong PoRender, rollback service về deployment V1 đã thành công. Trang trở về V1. Pin và auto-deploy pause là hành vi đúng: push mới không được ghi đè bản rollback. Gỡ pin và bật lại auto deploy để tiếp tục test.
- Đổi `healthy` trong `version.json` thành `false`, commit/push. Health check trả 503; candidate phải thất bại và URL giữ bản khỏe cũ. Chạy `npm run set-version -- V3` để đưa health về `true`, rồi commit/push lại.
- Rollback chỉ thay code/config, không phải khôi phục dữ liệu database.

Nếu push không deploy: kiểm tra agent Online, đúng repo/branch, webhook reachable/delivery được chấp nhận, auto sync và service auto deploy đang bật, không có version pin, và Syncs/Deploys không đang báo lỗi.

`BRAND_NAME`, `BRAND_LOGO_URL`, `APP_URL` là cấu hình công khai tùy chọn. Server chỉ trả các metadata cho phép; không có endpoint dump environment hay secret. Code/comment/identifier dùng tiếng Anh. Mã và giao diện của project là bản gốc, không dùng asset Render.
