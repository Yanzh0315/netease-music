
export interface LyricLine{
    time:number;
    text:string;
}

export default function parseLRC(raw:string):LyricLine[]{

    if(!raw.length) return [];
    const lines = raw.split('\n');
    const result : LyricLine[] = [];
    for(const line of lines){
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if(!match) continue;

        const min  = parseInt(match[1])
        const sec  = parseInt(match[2])
        const ms  = parseInt(match[3])
        const text = match[4].trim()

        const time = min*60 + sec + ms/1000
        result.push({time,text});
    }

    return result;

}