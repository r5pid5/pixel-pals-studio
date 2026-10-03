const item=(id,label,key,value=true,styleKey,styleValue)=>({id,label,key,value,styleKey,styleValue});
export const accessoryOptions=[
 item('sleep-cap','잠옷 모자','sleepCap'),item('space-helmet','우주 헬멧','spaceHelmet'),item('guitar','어쿠스틱 기타','guitar',true,'guitarStyle','acoustic'),item('guitar-electric','일렉기타','guitar',true,'guitarStyle','electric'),item('burger','손에 드는 햄버거','burger'),item('burger-body','몸에 끼우는 햄버거','bodyCostume','burger'),item('laptop','노트북','laptop'),item('sunglasses','선글라스','glasses',true,'glassesStyle','sunglasses'),item('earring-cuffs','귀 옆 더블 링','earrings','cuffs'),
 item('sunglasses-drop','둥근 물방울 선글라스','glasses',true,'glassesStyle','dropSunglasses'),item('glasses-tear-round','눈물 안경 · 둥근','glasses',true,'glassesStyle','tearRound'),item('glasses-tear-square','눈물 안경 · 사각','glasses',true,'glassesStyle','tearSquare'),
 item('syringe','커다란 주사기','syringe'),
 item('halo','천사링','halo'),item('horns','소악마 뿔','horns'),item('glasses-square','사각 안경','glasses',true,'glassesStyle','square'),item('glasses-round','동그란 안경','glasses',true,'glassesStyle','round'),item('headset','헤드셋','headset'),
 ...[['beret','베레모'],['y2k','Y2K 모자'],['bucket','버킷햇'],['cap','볼캡'],['beanie','비니'],['candyBasket','사탕바구니']].map(([v,n])=>item('hat-'+v,n,'hat',true,'hatStyle',v)),
 item('wings-angel','천사 날개','wings','angel'),item('wings-devil','소악마 날개','wings','devil'),
 ...[['left','왼쪽 리본'],['right','오른쪽 리본'],['both','양쪽 리본'],['top','머리 위 리본'],['neck','목 리본'],['chest','가슴 리본']].map(([v,n])=>item('ribbon-'+v,n,'ribbon',v)),
 ...[['star','별 핀'],['heart','하트 핀'],['cross','교차 핀'],['bar','나란한 핀'],['mixed','별과 실핀']].map(([v,n])=>item('clip-'+v,n,'hairClip',v)),
 item('earring-hoop','링 귀걸이','earrings','hoop'),item('earring-stud','작은 귀걸이','earrings','stud'),item('neck-choker','초커','neckAccessory','choker'),item('neck-bandana','반다나','neckAccessory','bandana'),item('pumpkin','펌킨호박','bodyCostume','pumpkin'),item('mug','둥근 머그컵','mug'),
 ...[['crown','머리 위 털'],['cheeks','볼 옆 털'],['both','머리와 볼 털'],['wisps','띄엄띄엄 직선 털'],['pairedWisps','두 가닥 직선 털']].map(([v,n])=>item('tuft-'+v,n,'tufts',v))
];
export function accessorySelected(s,a){return s[a.key]===a.value&&(!a.styleKey||s[a.styleKey]===a.styleValue);}
export function accessoryPatch(a,enabled=true){return{[a.key]:enabled?a.value:typeof a.value==='boolean'?false:'none',...(enabled&&a.styleKey?{[a.styleKey]:a.styleValue}:{}),...(enabled&&a.key==='guitar'?{guitarColor:a.styleValue==='electric'?'#91a8af':'#bf9868'}:{}),...(enabled&&a.key==='earrings'?{earringSide:a.value==='cuffs'?'right':'both'}:{})};}
export const clearAccessories={accessoryTransforms:{},syringe:false,clothing:'none',sleepCap:false,spaceHelmet:false,guitar:false,burger:false,laptop:false,halo:false,horns:false,glasses:false,hat:false,headset:false,wings:'none',ribbon:'none',hairClip:'none',earrings:'none',neckAccessory:'none',bodyCostume:'none',mug:false,tufts:'none'};
