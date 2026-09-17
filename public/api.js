// please use a different api key for your own projects - I don't want this to get rate limited by last.fm
const apikey = "375d07a53fd83a6e2a8456f9f124fb7d";
const minListeners = 50;

const cleanDisplayName = (name) =>
	name
		.replace(/\s*[.:\-–—]?\s*\(Original[^)]*\)/gi, "")
		.replace(/\s{2,}/g, " ")
		.trim();

const normalizeMetadataName = (name) =>
	name.toLowerCase().replace(/\s+/g, " ").trim();

const isSameMetadataName = (x, y) =>
	normalizeMetadataName(x) === normalizeMetadataName(y);

export const getData = async ({ user, mode, period, amount, filter }) => {
	user = encodeURIComponent(user);
	const requestedAmount = Number.parseInt(amount, 10);
	const extraResults = 20;

	const resp = await fetch(
		`https://ws.audioscrobbler.com/2.0/?method=user.gettop${mode}&user=${user}&period=${period}&limit=${requestedAmount + extraResults}&api_key=52e8e86c171ed9affffa34580666927a&format=json`,
	);
	const data = await resp.json();

	if (mode === "artists") {
		const artists = await Promise.all(
			data.topartists.artist
				.filter((artist) => {
					if (!filter) {
						return !artist.name.includes(", ");
					}
					return true;
				})
				.map(async (artist) => {
					const name = encodeURIComponent(artist.name);
					const data = await (
						await fetch(
							`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${name}&api_key=52e8e86c171ed9affffa34580666927a&format=json`,
						)
					).json();
					if (!data.artist) return null;
					if (!isSameMetadataName(data.artist.name, artist.name)) return null;

					return Promise.resolve([
						cleanDisplayName(artist.name),
						Number(data.artist.stats.listeners),
						artist.url,
					]);
				}),
		);

		return artists
			.filter((artist) => artist && artist[1] >= minListeners)
			.slice(0, requestedAmount);
	}

	if (mode === "albums") {
		const albums = await Promise.all(
			data.topalbums.album.map(async (album) => {
				const name = encodeURIComponent(album.name);
				const artist = encodeURIComponent(album.artist.name);
				const data = await (
					await fetch(
						`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&album=${name}&artist=${artist}&api_key=52e8e86c171ed9affffa34580666927a&format=json`,
					)
				).json();
				if (!data.album) return null;
				if (!isSameMetadataName(data.album.name, album.name)) return null;
				if (!isSameMetadataName(data.album.artist, album.artist.name))
					return null;

				const tracks = data.album?.tracks?.track;
				const trackCount = Array.isArray(tracks)
					? tracks.length
					: tracks
						? 1
						: null;

				if (trackCount === 1) return null;

				return Promise.resolve([
					cleanDisplayName(`${album.artist.name} – ${album.name}`),
					Number(data.album.listeners),
					album.url,
				]);
			}),
		);

		return albums
			.filter((album) => album && album[1] >= minListeners)
			.slice(0, requestedAmount);
	}

	if (mode === "tracks") {
		const tracks = await Promise.all(
			data.toptracks.track.map(async (track) => {
				const name = encodeURIComponent(track.artist.name);
				const data = await (
					await fetch(
						`https://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${name}&track=${encodeURIComponent(track.name)}&api_key=${apikey}&format=json`,
					)
				).json();
				if (!data.track) return null;
				if (!isSameMetadataName(data.track.name, track.name)) return null;
				if (!isSameMetadataName(data.track.artist.name, track.artist.name))
					return null;

				return Promise.resolve([
					cleanDisplayName(`${track.artist.name} – ${track.name}`),
					Number(data.track.listeners),
					track.url,
				]);
			}),
		);

		return tracks
			.filter((track) => track && track[1] >= minListeners)
			.slice(0, requestedAmount);
	}
};
