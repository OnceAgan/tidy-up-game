import * as THREE from 'three'
import { getGenre } from '../data/cassetteCatalog'

type Point = [number, number]

/** Original screen-printed VHS artwork, drawn once per series and shared by five tapes. */
export function createOriginalCoverTexture(title: string, genreId: number, series: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 1152
  const ctx = canvas.getContext('2d')!
  const genre = getGenre(genreId)
  const variant = series - 1
  const colors = [
    ['#111a2b', '#334663', '#e8bb72', '#9bcbd0'],
    ['#e7d7ad', '#246f72', '#ed7851', '#163f48'],
    ['#11122d', '#662951', '#faadcb', '#66d9e4'],
    ['#171b28', '#425c58', '#c7b0dc', '#e2d6a6'],
  ][genreId - 4]
  const [background, mid, accent, ink] = colors
  const polygon = (points: Point[], color: string | CanvasGradient) => {
    ctx.fillStyle = color; ctx.beginPath()
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.closePath(); ctx.fill()
  }
  const circle = (x: number, y: number, r: number, color: string) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  const line = (points: Point[], color: string, width = 3) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath()
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke()
  }
  ctx.fillStyle = background; ctx.fillRect(0, 0, 768, 1152)
  ctx.save(); ctx.beginPath(); ctx.rect(34, 140, 700, 650); ctx.clip()
  const wash = ctx.createLinearGradient(0, 140, 0, 790)
  wash.addColorStop(0, background); wash.addColorStop(1, mid)
  ctx.fillStyle = wash; ctx.fillRect(34, 140, 700, 650)

  if (genreId === 4) {
    // Noir: wet streets, a private eye, a train, a locked door or a river skyline.
    circle(540 - variant * 26, 255, 90, accent)
    polygon([[120, 210], [590, 790], [190, 790]], '#e8bb7220')
    for (let i = 0; i < 12; i++) {
      const x = 30 + i * 63, height = 120 + (i * 61 + variant * 73) % 260
      ctx.fillStyle = i % 2 ? background : '#1b293e'; ctx.fillRect(x, 650 - height, 58, height)
      for (let y = 660 - height; y < 625; y += 35) for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j + y + variant) % 3 ? '#c5b288' : '#40576a'; ctx.fillRect(x + 10 + j * 24, y, 9, 16)
      }
    }
    polygon([[34, 655], [734, 655], [734, 790], [34, 790]], '#101722')
    for (let i = 0; i < 14; i++) line([[55 + i * 46, 155], [22 + i * 46, 700]], '#9bcbd033', 2)
    for (let i = 0; i < 8; i++) line([[90 + i * 82, 690], [160 + i * 80, 724]], '#d8b98655', 5)
    if (variant === 1) {
      polygon([[100, 510], [520, 510], [640, 655], [130, 655]], ink)
      for (let i = 0; i < 5; i++) {ctx.fillStyle = '#182438'; ctx.fillRect(155 + i * 75, 534, 54, 58)}
      line([[100, 700], [700, 747]], accent, 4)
    } else if (variant === 3) {
      ctx.fillStyle = '#263c51'; ctx.fillRect(238, 340, 290, 380)
      ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.strokeRect(265, 365, 236, 330)
      circle(451, 560, 11, accent); ctx.font = '64px Georgia'; ctx.fillStyle = accent; ctx.fillText('17', 330, 475)
      circle(178, 616, 32, accent); ctx.fillStyle = accent; ctx.fillRect(172, 640, 12, 72)
    } else {
      const x = 310 + variant * 18
      circle(x, 463, 42, '#0b101c')
      polygon([[x - 70, 438], [x - 36, 390], [x + 40, 401], [x + 77, 449]], '#0b101c')
      polygon([[x - 24, 505], [x + 25, 500], [x + 85, 720], [x - 105, 720]], '#0b101c')
      polygon([[x - 36, 516], [x - 5, 549], [x + 15, 510]], accent)
      if (variant === 0) {ctx.fillStyle = ink; ctx.fillRect(x + 24, 581, 80, 52); line([[x + 24, 581], [x + 64, 607], [x + 104, 581]], '#243f60')}
      if (variant === 2) {circle(567, 600, 61, ink); circle(567, 600, 49, '#243349'); line([[609, 645], [661, 719]], ink, 17)}
      if (variant === 5) line([[40, 710], [725, 710]], ink, 12)
    }
  } else if (genreId === 5) {
    // Vintage travel posters: six distinct horizons.
    circle(525, 300 + variant * 10, 112, accent)
    polygon([[34, 700], [180, 400], [310, 605], [470, 360], [735, 710]], mid)
    polygon([[180, 400], [146, 470], [183, 449], [211, 476]], '#f4ecd3')
    polygon([[470, 360], [422, 459], [473, 420], [518, 448]], '#f4ecd3')
    polygon([[34, 695], [220, 583], [460, 720], [734, 601], [734, 790], [34, 790]], ink)
    if (variant === 0 || variant === 1) {
      ctx.fillStyle = mid; ctx.fillRect(34, 620, 700, 170)
      for (let y = 643; y < 790; y += 28) line([[50, y], [238, y + 4], [392, y], [590, y + 5], [720, y]], '#b4d8ce', 3)
      polygon([[195, 647], [562, 647], [505, 687], [245, 687]], ink)
      line([[383, 383], [383, 650]], ink, 7)
      polygon([[370, 392], [236, 625], [370, 625]], '#f3e6be')
      polygon([[396, 416], [520, 625], [396, 625]], accent)
    } else if (variant === 3) {
      polygon([[34, 655], [290, 558], [570, 744], [734, 615], [734, 790], [34, 790]], accent)
      polygon([[34, 763], [425, 635], [734, 746], [734, 790], [34, 790]], '#c85743')
      circle(378, 678, 14, ink); polygon([[368, 690], [387, 690], [401, 738], [352, 738]], ink)
    } else if (variant === 4) {
      polygon([[373, 366], [441, 366], [473, 693], [338, 693]], '#f2e8c8')
      ctx.fillStyle = accent; ctx.fillRect(366, 336, 83, 40)
      polygon([[348, 336], [407, 289], [467, 336]], ink)
      polygon([[407, 361], [707, 246], [707, 473]], '#fff0bf55')
    } else {
      polygon([[95, 790], [373, 632], [403, 632], [580, 790]], '#f1c496')
      for (let i = 0; i < 4; i++) {circle(120 + i * 165, 691 - i * 21, 9, ink); line([[120 + i * 165, 700 - i * 21], [110 + i * 165, 730 - i * 21]], ink, 9)}
    }
    circle(638, 211, 49, '#f4ecd3'); line([[638, 173], [620, 234], [658, 198], [638, 173]], ink, 4)
  } else if (genreId === 6) {
    // Neon record sleeves: skyline, turntable, synth keys and stage lighting.
    for (let i = 0; i < 7; i++) {
      const beam = ctx.createLinearGradient(80 + i * 104, 140, 400, 790)
      beam.addColorStop(0, i % 2 ? '#66d9e477' : '#faadcb66'); beam.addColorStop(1, '#11122d00')
      polygon([[80 + i * 104, 140], [100 + i * 104, 140], [560 - i * 42, 790], [450 - i * 40, 790]], beam)
    }
    circle(384, 460, 222, '#090b19')
    for (let r = 72; r <= 212; r += 11) {ctx.strokeStyle = r % 2 ? '#667a8c' : '#454766'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(384, 460, r, .2, Math.PI * 1.85); ctx.stroke()}
    circle(384, 460, 72, variant % 2 ? ink : accent)
    circle(384, 460, 12, '#15172a')
    ctx.save(); ctx.translate(384, 460); ctx.rotate(variant * .4); ctx.font = 'bold 28px Arial'; ctx.fillStyle = '#181b32'; ctx.textAlign = 'center';ctx.fillText('SIDE B', 0, -24);ctx.restore()
    if (variant === 1 || variant === 5) {
      line([[567, 632], [567, 750], [620, 772]], accent, 9)
      circle(565, 600, 26, ink);line([[552, 591], [577, 613]], '#11122d', 4)
      for (let i = 0; i < 9; i++) {ctx.fillStyle = '#161931';ctx.fillRect(35 + i * 82, 765 - (i * 33 % 85), 68, 120)}
    } else if (variant === 4) {
      for (let i = 0; i < 14; i++) {ctx.fillStyle = '#e8dfdd';ctx.fillRect(80 + i * 44, 701, 39, 115);if(i % 7!==2&&i % 7!==6){ctx.fillStyle='#13172e';ctx.fillRect(107 + i*44,701,22,72)}}
    } else {
      for (let i = 0; i < 30; i++) {const height = 30 + Math.sin(i * .7 + variant) ** 2 * 92;ctx.fillStyle=i%2?ink:accent;ctx.fillRect(68+i*22,770-height,10,height)}
      line([[630, 283], [630, 571], [577, 603]], ink, 10)
    }
  } else {
    // Gothic paper-cut imagery: an impossible house, garden, letters, chapel, candle.
    circle(523 - variant * 27, 296, 114, accent)
    circle(567 - variant * 27, 267, 101, background)
    for (let i = 0; i < 18; i++) {
      const x = 31 + i * 43, y = 435 + (i * 37 % 150)
      polygon([[x, y], [x - 38, 730], [x + 38, 730]], '#172a29')
      line([[x, y + 45], [x, 780]], '#101b21', 5)
    }
    polygon([[34, 760], [264, 699], [521, 712], [734, 771], [734, 790], [34, 790]], '#101820')
    if (variant === 0 || variant === 4) {
      ctx.fillStyle = '#18222c';ctx.fillRect(225, 468, 296, 262)
      polygon([[185, 478], [368, 327], [558, 478]], '#0b1720')
      polygon([[442, 493], [442, 382], [483, 313], [524, 382], [524, 600]], '#101b25')
      for (const x of [269, 372, 466]) {ctx.fillStyle=ink;ctx.fillRect(x, 510, 25, 56);line([[x+12,510],[x+12,566]],mid,3)}
      ctx.fillStyle = '#b296cc';ctx.fillRect(347, 644, 49, 86)
      if(variant===4){line([[483,289],[483,333]],ink,4);line([[468,302],[497,302]],ink,4)}
    } else if (variant === 1) {
      ctx.fillStyle='#142526';ctx.fillRect(258,350,260,381);ctx.strokeStyle=accent;ctx.lineWidth=9;ctx.strokeRect(258,350,260,381)
      polygon([[507,361],[434,419],[434,724],[507,724]],'#c7b0dc');circle(432,576,7,ink)
      polygon([[352,727],[507,727],[709,790],[195,790]],'#c7b0dc44')
    } else if (variant === 2) {
      for(let i=0;i<7;i++){const x=100+i*89;line([[x,740],[x,571+i%3*40]],ink,3);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;circle(x+Math.cos(a)*16,562+i%3*40+Math.sin(a)*16,13,accent)}circle(x,562+i%3*40,7,ink)}
      line([[67,757],[701,757]],mid,9)
    } else if (variant === 3) {
      for(let i=0;i<5;i++){ctx.save();ctx.translate(290+i*35,450+i*50);ctx.rotate((i-2)*.22);ctx.fillStyle=ink;ctx.fillRect(-110,-40,220,113);line([[-110,-40],[0,29],[110,-40]],mid,4);ctx.restore()}
    } else {
      ctx.fillStyle=ink;ctx.fillRect(340,480,85,220);circle(383,466,22,accent)
      polygon([[384,352],[359,432],[384,456],[412,424]],'#efc891');polygon([[384,391],[377,429],[388,442],[398,423]],'#fff0bf')
      circle(383,424,94,'#efc89115');line([[294,711],[471,711]],accent,12)
    }
    for(let i=0;i<9;i++)line([[35,671+i*13],[200,662+i*13],[470,681+i*13],[730,667+i*13]],'#c7b0dc18',7)
  }
  // Fine deterministic print grain; no image downloads or per-frame drawing.
  for(let i=0;i<3800;i++){ctx.fillStyle=i%2?'#ffffff0a':'#00000013';ctx.fillRect(34+(i*83+series*17)%700,140+(i*137)%650,2,2)}
  ctx.restore()
  ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.strokeRect(34,34,700,1084)
  ctx.fillStyle=genreId===5?ink:accent;ctx.textAlign='left';ctx.font='bold 26px Arial';ctx.fillText(genre.name.toUpperCase(),56,84)
  ctx.textAlign='right';ctx.font='20px Arial';ctx.fillText(`АРХИВ / ${String(series).padStart(2,'0')}`,712,84)
  ctx.textAlign='left';ctx.fillStyle=genreId===5?ink:'#eee8dc';ctx.font='bold 62px Georgia'
  const words=title.toUpperCase().split(/\s+/),lines:string[]=[];let current=''
  for(const word of words){const candidate=current?`${current} ${word}`:word;if(current&&ctx.measureText(candidate).width>648){lines.push(current);current=word}else current=candidate}
  if(current)lines.push(current)
  lines.forEach((text,i)=>ctx.fillText(text,56,870+i*72,656))
  ctx.fillStyle=genreId===5?ink:accent;ctx.font='20px Arial';ctx.fillText('ПОЛНАЯ СЕРИЯ · 5 ЧАСТЕЙ',56,1080)
  ctx.textAlign='right';ctx.fillText('VHS / STEREO',712,1080)
  const texture=new THREE.CanvasTexture(canvas)
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8
  return texture
}
