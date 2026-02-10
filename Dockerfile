FROM nginx:alpine
# 拷贝 Nginx 配置（见下方第 4 点）
COPY ./default.conf /etc/nginx/conf.d/default.conf
# 拷贝构建好的静态资源
COPY ./dist /usr/share/nginx/html
EXPOSE 80
