# Bitrate

在 MyGo Music 侧栏查看网易云歌曲各音质档位和码率。Look up NetEase Cloud Music quality levels and bitrates from a MyGo Music sidebar page.

This is a [MyGo Music](https://github.com/egoist/mygo-music) plugin. It is one `plugin.json` and one JavaScript file. There is nothing to build, and the same plugin runs on every platform.

## English

### What it does

Open **Bitrate** in the sidebar, then use the app's search field. Browse pages have no text field of their own.

- Type a song name. The first matches come back, one row per quality level.
- Paste a numeric NetEase song ID, or a `music.163.com` song link that contains one.

Each row's title is a numeric bitrate in kbps, plus the level name (`standard`, `higher`, `exhigh`, `lossless`, `hires`, and any further level the API actually returns). The line under the title names the song and artists, then the audio format, file size, and sample rate when NetEase sends them. The bitrate is the API's `br` value, rounded to the nearest kbps. A privilege cap such as `999000` is not shown as if it were a file bitrate.

With no cookie, rows come from the public song record (`l`, `m`, `h`, `sq`, `hr`) and from privilege fields such as the max level. A higher level is left out when that record has no bitrate for it. The page says so.

An optional **NetEase cookie** setting takes `MUSIC_U`, or a cookie string that contains it. The plugin then asks NetEase which membership levels that account can open, including lossless, Hi-Res, and later levels such as spatial, immersive, and master when the API returns them. The audio format is filled in only when that response includes one. The cookie stays in the app's settings and is sent only to `interface.music.163.com`. It is not written into this repository. Do not share it.

### What it cannot do

**This plugin does not show the bitrate of whatever is playing now.** MyGo Music plugins cannot inject anything into Now Playing. The host does not expose the current track, and it does not expose another plugin's stream bitrate. There is no `host.nowPlaying`, and this plugin does not pretend there is.

This is not a playback source. It does not export `stream` or remote playback, and it does not ship playable tracks. Result rows are marked unavailable, so the app does not offer to play them. A right-click can still copy the title or the song's NetEase page.

### Install

In MyGo Music: **Settings → Plugins → + → from GitHub**, and enter:

```text
ivanxguo/mygo-music-bitrate
```

Or open this link in a browser. The app asks before it installs:

```text
mygo-music://install-plugin?repo=ivanxguo/mygo-music-bitrate
```

[Install in MyGo Music](mygo-music://install-plugin?repo=ivanxguo/mygo-music-bitrate)

The app needs 0.1.8 or later. After installing, switch to the plugin, open **Bitrate** in the sidebar, and search.

### Levels

| API level | Usual meaning |
| --- | --- |
| `standard` | Standard, often 128 kbps |
| `higher` | Higher, often 192 kbps |
| `exhigh` | Extremely high, often 320 kbps |
| `lossless` | Lossless |
| `hires` | Hi-Res |
| `jyeffect`, `sky`, `jymaster` | Shown only when an account check returns them |

The number on the row is that song's own bitrate, not the "often" column.

## 中文

### 这是做什么的

在侧栏打开**码率**，然后用应用自己的搜索框。浏览页没有输入框。

- 输入歌名。会返回前面几条匹配，每个音质档位一行。
- 粘贴网易云歌曲的数字 ID，或一条带有该 ID 的 `music.163.com` 歌曲链接。

每一行的标题是以 kbps 计的码率数字，以及档位名称（`standard`、`higher`、`exhigh`、`lossless`、`hires`，以及接口实际返回的其他档位）。标题下面一行是歌名和歌手，以及网易云有返回时的音频格式、文件大小和采样率。码率来自接口的 `br`，换算成 kbps 后四舍五入。权限里的上限（例如 `999000`）不会被当成文件码率显示。

没有 Cookie 时，数据来自公开的歌曲记录（`l`、`m`、`h`、`sq`、`hr`）和权限字段，例如最高档位。公开记录里没有码率的更高档位不会出现。页面上写了这一点。

设置里可以选填**网易云 Cookie**：填 `MUSIC_U`，或一段包含它的 Cookie。插件会向网易云查询这个账号能打开哪些会员档位，包括无损、Hi-Res，以及接口有返回时的高清环绕声、沉浸环绕声、超清母带。只有响应里带了音频格式时才会显示格式。Cookie 存在应用的设置里，并且只发给 `interface.music.163.com`。它不会写进这个仓库。不要把它发给别人。

### 它做不到什么

**这个插件不会显示正在播放的歌曲的码率。** MyGo Music 插件不能往「正在播放」里加界面。宿主不会提供当前曲目，也不会提供另一个插件的串流码率。没有 `host.nowPlaying`，这个插件也不假装有。

这不是播放源。它不提供 `stream`，也不做远程播放，更不会带上可播放的曲目。结果行被标成不可用，所以应用不会提供播放。右键仍可以复制标题，或复制这首歌的网易云页面。

### 安装

在 MyGo Music 里打开 **设置 → 插件 → + → 从 GitHub**，填入：

```text
ivanxguo/mygo-music-bitrate
```

也可以在浏览器里打开下面的链接。应用会先询问再安装：

```text
mygo-music://install-plugin?repo=ivanxguo/mygo-music-bitrate
```

[在 MyGo Music 中安装](mygo-music://install-plugin?repo=ivanxguo/mygo-music-bitrate)

需要 0.1.8 或更新的版本。安装后切换到这个插件，打开侧栏的**码率**，再搜索。

### 档位

| 接口档位 | 通常含义 |
| --- | --- |
| `standard` | 标准，常见为 128 kbps |
| `higher` | 较高，常见为 192 kbps |
| `exhigh` | 极高，常见为 320 kbps |
| `lossless` | 无损 |
| `hires` | Hi-Res |
| `jyeffect`、`sky`、`jymaster` | 只有账号查询返回了这些档位时才显示 |

行上的数字是这一首歌自己的码率，不是表里的「常见」值。

## License

MIT. See [LICENSE](LICENSE).
