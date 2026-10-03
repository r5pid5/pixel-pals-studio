const style=(id,label,primary,secondary,trim)=>({id,label,colors:{clothingColor:primary,clothingSecondaryColor:secondary,clothingTrimColor:trim}});
export const clothingStyles=[
 style('tee','기본 티','#eee5d5','#faf5ed','#8e9caa'),
 style('raglan','나그랑 티','#f5efdf','#829eac','#6d8189'),
 style('hoodie','후드티 · 후드 내림','#b7aecb','#e8e0ed','#827492'),
 style('hoodieUp','후드티 · 후드 씀','#b7aecb','#e8e0ed','#827492'),
 style('pajamas','잠옷','#c3c9df','#f9f0de','#8589ad'),
 style('spacesuit','우주복','#e6e9e2','#9ba9b7','#d99c6a'),
 style('suit','정장','#575d70','#f4edde','#a57782'),
 style('coat','코트','#b89a79','#e7d7bb','#766452'),
 style('uniform','교복','#efe6d3','#626980','#aa777c'),
 style('prison','죄수복','#ebe5d8','#686577','#c18c62'),
 style('sweater','케이블 니트','#c6ba9f','#ede2cc','#9b8e74'),
 style('cardigan','가디건','#b3c4b7','#f4e9d8','#738d7c'),
 style('overalls','멜빵옷','#839aac','#efe9d7','#d0b688'),
 style('raincoat','레인코트','#e4bb68','#f8ecc7','#a08b62'),
 style('puffer','패딩','#b6c1d4','#e7e5e3','#74849c'),
 style('sailor','세일러복','#e9e9df','#7d91a3','#c29b9e'),
 style('apron','앞치마','#cca8a5','#eee4d2','#916967'),
 style('varsity','야구점퍼','#94a8a1','#ffffff','#647c76')
];
export const clothingOptions=[['none','옷 없음'],...clothingStyles.map(s=>[s.id,s.label])];
export function clothingPatch(id){return{clothing:id,...(clothingStyles.find(s=>s.id===id)?.colors??{})};}
