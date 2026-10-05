interface Artist {
  id: number;
  name: string;
}
export default function displayArtist(artistList:Artist[] | undefined):string{
     if(!Array.isArray(artistList) || artistList?.length === 0) return '未知歌手';
      return artistList.map((a) => a.name).join(' ');
}