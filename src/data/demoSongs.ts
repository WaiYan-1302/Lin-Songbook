import { parseChordPro } from '../music/chordParser'

const sources = [
`{title: Lanterns at Low Tide}
{artist: Fretbook Sessions}
{key: C}
{tempo: 82}
{time: 4/4}
{tags: folk, beginner}

{start_of_verse: Verse 1}
[C]Windows catch the [Am]last light
[F]Boats are breathing [G]slow
[C]Footsteps on the [Am]boardwalk
[F]Find the way back [G]home
{end_of_verse}

{start_of_chorus: Chorus}
[F]Hold this hour [C]gently
[Am]Let the evening [G]stay
[F]Lanterns at the [C]low tide
[G]Show us all the [C]way
{end_of_chorus}`,
`{title: Paper Cranes}
{artist: 紙の音楽室}
{key: G}
{tempo: 94}
{tags: japanese, pop}

{start_of_verse: Aメロ}
[G]窓辺に置いた [D]小さな願い
[Em]朝のひかりで [C]羽をひらく
[G]昨日のことも [D]明日のことも
[Em]歌に変えたら [C]軽くなる
{end_of_verse}

{start_of_chorus: サビ}
[C]風に乗って [G]遠くまで
[D]僕らの声が [Em]届くように
[C]折り目の中の [G]夢を連れて
[D]青い空へ [G]飛んでゆく
{end_of_chorus}`,
`{title: Northbound Morning}
{artist: Rowan & Pine}
{key: D}
{tempo: 108}
{capo: 2}
{tags: travel, bright}

{start_of_verse: Verse}
[C]Coffee in a [G/B]paper cup
[Am]Map folded on the [F]seat
[C]Every mile is [G]waking up
[F]Underneath our [G]feet
{end_of_verse}

{start_of_chorus: Chorus}
[Am]Northbound in the [F]morning
[C]Sunrise keeping [G]time
[Am]No need for a [F]reason
[G]Just another [C]line
{end_of_chorus}`,
`{title: Cedar Room Waltz}
{artist: The Quiet Hours}
{key: Am}
{tempo: 72}
{time: 3/4}
{tags: waltz, moody}

{start_of_verse: Verse}
[Am]Dust turns gold in the [Dm]cedar room
[G]Three quiet steps through the [C]afternoon
[F]Old floorboards carry an [Dm]unfinished tune
[E7]Round and around with the [Am]moon
{end_of_verse}

{start_of_bridge: Bridge}
[F]Maybe the walls still [C]remember
[Dm]Every December we [Am]knew
[F]Play me the part without [C]ending
[E7]I will keep dancing with [Am]you
{end_of_bridge}`,
]

export const demoSongs = sources.map((source, index) => parseChordPro(source, `demo-${index + 1}`))
