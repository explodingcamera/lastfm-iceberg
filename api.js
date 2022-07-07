const apikey = "375d07a53fd83a6e2a8456f9f124fb7d";

export const getData = async ({user, mode, period, amount}) => {
	user = encodeURIComponent(user)

	const resp = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettop${mode}&user=${user}&period=${period}&limit=${parseInt(amount) + (mode === "artists" ? 20 : 0)}&api_key=52e8e86c171ed9affffa34580666927a&format=json`)
	const data = await resp.json();

	if (mode === "artists")
		return await Promise.all(data.topartists.artist.filter(artist => !artist.name.includes(", ")).slice(0, amount).map(async artist => {
			const name = encodeURIComponent(artist.name);
			const data = await(await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${name}&api_key=52e8e86c171ed9affffa34580666927a&format=json`)).json()
			return Promise.resolve([artist.name, data.artist ? Number(data.artist.stats.listeners) : 0, artist.url])
		}));

	if (mode === "albums")
		return await Promise.all(data.topalbums.album.map(async album => {
			const name = encodeURIComponent(album.name);
			const artist = encodeURIComponent(album.artist.name);
			const data = await(await fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&album=${name}&artist=${artist}&api_key=52e8e86c171ed9affffa34580666927a&format=json`)).json()
			return Promise.resolve([album.artist.name + ' – ' + album.name, data.album ? Number(data.album.listeners) : 0, album.url])
		}));

	if (mode === "tracks")
		return await Promise.all(data.toptracks.track.map(async track => {
			const name = encodeURIComponent(track.artist.name);
			const data = await(await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${name}&track=${encodeURIComponent(track.name)}&api_key=${apikey}&format=json`)).json()
			return Promise.resolve([track.artist.name + ' – ' + track.name, data.track ? Number(data.track.listeners) : 0, track.url])
		}));
}