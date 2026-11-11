// Bitrate lookup for NetEase Cloud Music.
//
// Search is the only way in: a browse page has no text field. A song name
// searches the catalog. A numeric song ID, or a music.163.com link that
// carries one, loads that song. Each quality level is one search row. The
// title is the numeric bitrate. The line under it is the song, then format,
// file size, and sample rate when the API sends them.
//
// Rows are unavailable on purpose. This plugin does not export stream or
// remote playback, and it does not know what is playing now.

const API_HOST = "interface.music.163.com";
const EAPI_KEY = "e82ckenh8dichen8";
const SONG_LIMIT = 12;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Catalog objects on a song, in the order a listener compares them.
// br and size come from these. type does not: only the account URL check
// returns an audio format.
const CATALOG = [
  { id: "standard", key: "l", label: "Standard" },
  { id: "higher", key: "m", label: "Higher" },
  { id: "exhigh", key: "h", label: "Extremely High" },
  { id: "lossless", key: "sq", label: "Lossless" },
  { id: "hires", key: "hr", label: "Hi-Res" },
];

// Newer levels are not on l/m/h/sq/hr. They show up only when an account
// check returns a real bitrate for them.
const EXTRA = [
  { id: "jyeffect", label: "Spatial" },
  { id: "sky", label: "Immersive" },
  { id: "jymaster", label: "Master" },
];

const LABEL_BY_ID = {};
for (const level of CATALOG.concat(EXTRA)) LABEL_BY_ID[level.id] = level.label;

function t(text) {
  return host.t(text);
}

function levelLabel(id) {
  return LABEL_BY_ID[id] || id;
}

function accountCookie() {
  return String(host.setting("cookie") || "").replace(/[\r\n]/g, "").trim();
}

function hasAccountCookie() {
  return accountCookie() !== "";
}

// A bare token is MUSIC_U. A string that already has "=" is sent as the
// Cookie header. The value is never logged.
function cookieHeader() {
  const raw = accountCookie();
  if (!raw) return "os=pc; appver=2.10.13";
  if (raw.indexOf("=") === -1) return "MUSIC_U=" + raw + "; os=pc; appver=2.10.13";
  return raw;
}

function asId(id) {
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(n) || n <= 0 || Math.floor(n) !== n || n > 9007199254740991) {
    throw new Error(t("That song ID cannot be looked up"));
  }
  return n;
}

function queryId(query) {
  if (/^\d+$/.test(query)) return query;
  if (query.indexOf("163.com") === -1) return "";
  const match = query.match(/[?&#]id=(\d+)/);
  return match ? match[1] : "";
}

function kbps(br) {
  return String(Math.round(br / 1000));
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(kb >= 10 ? 0 : 1) + " KB";
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + " MB";
  return (mb / 1024).toFixed(2) + " GB";
}

function formatRate(sr) {
  if (!sr || sr <= 0) return "";
  const khz = sr / 1000;
  const text = Math.abs(khz - Math.round(khz)) < 0.05 ? String(Math.round(khz)) : khz.toFixed(1);
  return text + " kHz";
}

function formatType(type) {
  if (!type) return "";
  return String(type).toUpperCase();
}

function coverOf(url) {
  if (!url) return "";
  let out = String(url);
  if (out.indexOf("http://") === 0) out = "https://" + out.slice("http://".length);
  if (out.indexOf("param=") !== -1) return out;
  return out + (out.indexOf("?") === -1 ? "?" : "&") + "param=300y300";
}

function songLine(song) {
  const names = [];
  const artists = song.ar || [];
  for (const artist of artists) {
    if (artist && artist.name) names.push(artist.name);
  }
  const title = song.name || String(song.id);
  return names.length ? title + " — " + names.join(", ") : title;
}

function privilegeNote(song) {
  const privilege = song.privilege || {};
  const parts = [];
  if (privilege.maxBrLevel && privilege.maxBrLevel !== "none") {
    parts.push(t("max level") + " " + t(levelLabel(privilege.maxBrLevel)));
  }
  if (privilege.plLevel && privilege.plLevel !== "none") {
    parts.push(t("can play") + " " + t(levelLabel(privilege.plLevel)));
  } else if (hasAccountCookie() && privilege.plLevel === "none") {
    parts.push(t("no playback level for this cookie"));
  }
  return parts.join(" · ");
}

function subtitle(song, parts) {
  const bits = [songLine(song)];
  for (const part of parts) {
    if (part) bits.push(part);
  }
  const note = privilegeNote(song);
  if (note) bits.push(note);
  return bits.join(" · ");
}

function makeTrack(song, levelId, title, parts) {
  const album = song.al || {};
  return {
    id: String(song.id) + ":" + levelId,
    name: title,
    artists: [{ name: subtitle(song, parts) }],
    album: {
      name: album.name || "",
      imageUrl: coverOf(album.picUrl),
    },
    duration: song.dt || 0,
    url: "https://music.163.com/song?id=" + song.id,
    unavailable: true,
  };
}

function levelTitle(br, id, label, denied) {
  const name = t(label);
  const shown = name === id ? name : name + " (" + id + ")";
  let title = kbps(br) + " kbps · " + shown;
  if (denied) title += " · " + t("not granted");
  return title;
}

// fileParts prefers the account check's size and format when that check
// returned a file. Sample rate stays on the catalog object, which is where
// NetEase puts sr. A denied check still keeps the public bitrate and size,
// and says the account was not given that file.
function tracksForSong(song, probed) {
  const tracks = [];
  const seen = {};
  for (const level of CATALOG) {
    const file = song[level.key];
    const probe = probed ? probed[level.id] : null;
    const granted = !!(probe && probe.granted && probe.br > 0);
    const denied = !!(probe && probe.granted === false && !probe.error);
    const br = granted ? probe.br : file && file.br;
    const size = (granted && probe.size) || (file && file.size) || 0;
    if (!(br > 0)) continue;
    seen[level.id] = true;
    const parts = [formatType(granted ? probe.type : ""), formatSize(size), formatRate(file && file.sr)];
    tracks.push(makeTrack(song, level.id, levelTitle(br, level.id, level.label, denied), parts));
  }
  for (const level of EXTRA) {
    const probe = probed ? probed[level.id] : null;
    if (!probe || !probe.granted || !(probe.br > 0)) continue;
    seen[level.id] = true;
    const parts = [formatType(probe.type), formatSize(probe.size)];
    tracks.push(makeTrack(song, level.id, levelTitle(probe.br, level.id, level.label, false), parts));
  }
  const maxId = song.privilege && song.privilege.maxBrLevel;
  if (maxId && maxId !== "none" && !seen[maxId]) {
    const label = levelLabel(maxId);
    const name = t(label);
    const shown = name === maxId ? name : name + " (" + maxId + ")";
    tracks.push(makeTrack(song, maxId, shown + " · " + t("No bitrate in the public record"), []));
  }
  if (tracks.length === 0) {
    tracks.push(makeTrack(song, "none", t("No quality levels in the public record"), []));
  }
  return tracks;
}

async function eapi(apiPath, fields) {
  const data = Object.assign({}, fields, {
    header: {
      os: "pc",
      appver: "2.10.13",
      osver: "",
      deviceId: "mygo-bitrate",
    },
  });
  const text = JSON.stringify(data);
  const digest = host.crypto.md5("nobody" + apiPath + "use" + text + "md5forencrypt");
  const params = host.crypto.aesEcbEncrypt(EAPI_KEY, apiPath + "-36cd479b6b5-" + text + "-36cd479b6b5-" + digest);
  let response;
  try {
    response = await fetch("https://" + API_HOST + apiPath.replace("/api/", "/eapi/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://music.163.com/",
        "User-Agent": USER_AGENT,
        Cookie: cookieHeader(),
      },
      body: "params=" + params,
    });
  } catch (e) {
    throw new Error(t("The NetEase request failed"));
  }
  if (!response.ok) throw new Error(t("The NetEase request failed"));
  let json;
  try {
    json = await response.json();
  } catch (e) {
    throw new Error(t("NetEase returned something that was not JSON"));
  }
  if (!json || json.code !== 200) throw new Error(t("NetEase did not accept that request"));
  return json;
}

async function songById(id) {
  const json = await eapi("/api/v3/song/detail", {
    c: JSON.stringify([{ id: asId(id), v: 0 }]),
  });
  const song = (json.songs || [])[0];
  if (!song) return null;
  if (!song.privilege && json.privileges && json.privileges[0]) song.privilege = json.privileges[0];
  return song;
}

async function searchSongs(query) {
  const json = await eapi("/api/cloudsearch/pc", {
    s: query,
    type: 1,
    limit: SONG_LIMIT,
    offset: 0,
    total: true,
  });
  const result = json.result || {};
  return result.songs || [];
}

// One request per level, for every song on the page. The audio URL is
// discarded: this plugin does not play it.
async function probeLevels(ids) {
  const bySong = {};
  for (const id of ids) bySong[String(id)] = {};
  const levels = CATALOG.concat(EXTRA);
  await Promise.all(levels.map(async (level) => {
    try {
      const json = await eapi("/api/song/enhance/player/url/v1", {
        ids: JSON.stringify(ids),
        level: level.id,
        encodeType: "flac",
        immerseType: "c51",
      });
      const seen = {};
      for (const item of json.data || []) {
        if (!item || item.id == null) continue;
        const id = String(item.id);
        seen[id] = true;
        if (!bySong[id]) bySong[id] = {};
        if (item.code === 200 && item.br > 0) {
          bySong[id][level.id] = {
            br: item.br,
            size: item.size || 0,
            type: item.type || "",
            granted: true,
          };
        } else {
          bySong[id][level.id] = { granted: false };
        }
      }
      for (const id of ids) {
        const key = String(id);
        if (!seen[key]) {
          if (!bySong[key]) bySong[key] = {};
          bySong[key][level.id] = { granted: false };
        }
      }
    } catch (e) {
      for (const id of ids) {
        const key = String(id);
        if (!bySong[key]) bySong[key] = {};
        bySong[key][level.id] = { error: true };
      }
    }
  }));
  return bySong;
}

export async function search({ query, kind, offset }) {
  if (kind && kind !== "tracks") return { more: false };
  const q = String(query || "").trim();
  // The app's next offset is the number of rows already shown, not a song
  // index. This lookup returns one page and stops.
  if (!q || offset > 0) return { tracks: [], more: false };

  const id = queryId(q);
  const songs = id ? [await songById(id)].filter(Boolean) : await searchSongs(q);
  let probed = {};
  if (hasAccountCookie() && songs.length) {
    const ids = [];
    for (const song of songs) {
      if (song && song.id != null) ids.push(asId(song.id));
    }
    probed = await probeLevels(ids);
  }
  const tracks = [];
  for (const song of songs) {
    if (!song || song.id == null) continue;
    const rows = tracksForSong(song, probed[String(song.id)]);
    for (const row of rows) tracks.push(row);
  }
  return { tracks: tracks, more: false };
}

export function browse() {
  return {
    title: t("Bitrate"),
    subtitle: t("NetEase Cloud Music"),
    description: [
      t("Search from the field at the top of the app. This page has nowhere to type. Enter a song name, or paste a numeric NetEase song ID."),
      t("This does not show the bitrate of whatever is playing now. MyGo Music does not give a plugin the current track, and it does not give it another plugin's stream bitrate."),
      t("Each result row is one quality level, such as standard, higher, exhigh, lossless, or hires. The title is the numeric bitrate in kbps. The line under it is the song, the audio format, the file size, and the sample rate when NetEase sends them. Nothing here can be played."),
      t("With no NetEase cookie, rows come from the public song record and from its privilege fields, including the max level when NetEase sends one. A higher level is left out when that record does not include a bitrate for it. Paste MUSIC_U, or a cookie that contains it, into this plugin's settings to ask which membership levels that account can open, and to fill in the format when the API returns one. The cookie is sent only to NetEase."),
    ].join("\n"),
    sections: [
      {
        title: t("Look up a song"),
        empty: t("Nothing is listed on this page. Use the app search. Results show under Search."),
      },
    ],
  };
}
