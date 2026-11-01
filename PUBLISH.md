# 后续开放在线 Demo

当前优先保持仓库 private。发布工作流已准备好，但在 private 状态下会直接跳过；现在没有启用公开 Pages，也没有改变仓库可见性。

## 准备开放时

1. 由仓库所有者将这个展示仓库改为 public；完整工程仓库可继续保持 private。
2. 在展示仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 打开 **Actions → Deploy interview demo → Run workflow**，选择 main 并运行。

部署成功后，Actions 的 github-pages environment 会显示可直接在线观看的链接。默认预计地址是 `https://djh200202.github.io/pi05-vla-demo/`；它目前尚未发布，不要将其作为已上线链接发送。

首次开放后，后续推送到main会自动更新网站。工作流只打包静态页面、图表和精选录像，不运行模型、不训练、不评估。

设置Pages发布源需要所有者操作；工作流不保存个人令牌，也不自动修改仓库可见性。仍为private时，即使手动运行工作流，也不会部署网页。

官方参考：[使用GitHub Pages自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
