// Tes engine aturan: unit + fuzz. Jalankan: node test/engine.test.js index.html
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const E=new Function(src+';return{B,GRP,CARDS,newGame,act,who,kick,grp,rent}')();
const {B,GRP,CARDS,newGame,act,who,kick,grp,rent}=E;

// dadu terkendali
const realRand=Math.random;let queue=[];
Math.random=()=>queue.length?queue.shift():realRand();
const dice=(...d)=>queue.push(...d.map(k=>(k-.5)/6));
const game=n=>{const S={phase:'lobby',players:[...Array(n)].map((_,i)=>({id:'p'+i,name:'P'+i,on:true}))};newGame(S);return S};
const ok=(S,i,a)=>{const e=act(S,i,a);assert.strictEqual(e,undefined,JSON.stringify(a)+' -> '+e)};
const no=(S,i,a)=>assert.ok(act(S,i,a),'harusnya ditolak: '+JSON.stringify(a));
let n=0;const t=(name,f)=>{queue=[];f();n++;console.log('ok',name)};

t('papan 40 petak, 28 properti, 16+16 kartu',()=>{
  assert.strictEqual(B.length,40);
  assert.strictEqual(B.filter(s=>s.c).length,28);
  assert.strictEqual(B.filter(s=>s.t==='p').length,22);
  assert.strictEqual(B.reduce((a,s)=>a+(s.c||0),0),5690); // total harga papan klasik
  assert.strictEqual(CARDS.n.length,16);assert.strictEqual(CARDS.k.length,16);
  assert.deepStrictEqual([0,1,2,3,4,5,6,7].map(g=>grp(g).length),[2,3,3,3,3,3,3,2]);
});
t('modal awal $1500, beli, sewa, sewa 2x set lengkap',()=>{
  const S=game(2);assert.ok(S.players.every(p=>p.cash===1500));
  dice(1,2);ok(S,0,{t:'roll'});            // ke 3 Tegal
  assert.strictEqual(who(S).k,'buy');ok(S,0,{t:'buy'});
  assert.strictEqual(S.players[0].cash,1440);ok(S,0,{t:'end'});
  dice(1,2);ok(S,1,{t:'roll'});            // P1 kena sewa 4
  assert.strictEqual(S.players[1].cash,1496);assert.strictEqual(S.players[0].cash,1444);
  S.own[1]=0;assert.strictEqual(rent(S,3),8);
  S.lvl[3]=1;assert.strictEqual(rent(S,3),20);S.lvl[3]=5;assert.strictEqual(rent(S,3),450);
});
t('stasiun 25/50/100/200, perusahaan 4x/10x',()=>{
  const S=game(2);S.dice=[3,4];
  [5,15,25,35].forEach((q,k)=>{S.own[q]=0;assert.strictEqual(rent(S,5),25*2**k)});
  S.own[12]=0;assert.strictEqual(rent(S,12),28);S.own[28]=0;assert.strictEqual(rent(S,12),70);
});
t('lewat MULAI terima $200',()=>{
  const S=game(2);S.players[0].pos=38;dice(1,2);ok(S,0,{t:'roll'}); // ke 1
  assert.strictEqual(S.players[0].pos,1);assert.strictEqual(S.players[0].cash,1700);
});
t('pajak $200 dan $100',()=>{
  const S=game(2);dice(1,3);ok(S,0,{t:'roll'});assert.strictEqual(S.players[0].cash,1300);
  S.players[1].pos=36;ok(S,0,{t:'end'});dice(1,1);ok(S,1,{t:'roll'});assert.strictEqual(S.players[1].cash,1400);
});
t('kembar = lempar lagi; kembar 3x masuk penjara',()=>{
  const S=game(2);S.own.fill(1);S.mort.fill(1); // semua milik P1 & digadaikan: tak ada efek mendarat
  S.players[0].pos=10;
  dice(1,1);ok(S,0,{t:'roll'});assert.strictEqual(who(S).k,'roll');
  S.players[0].pos=10;dice(1,1);ok(S,0,{t:'roll'});assert.strictEqual(who(S).k,'roll');
  S.players[0].pos=10;dice(2,2);ok(S,0,{t:'roll'});
  assert.strictEqual(S.players[0].jail,1);assert.strictEqual(S.players[0].pos,10);assert.strictEqual(who(S).k,'end');
});
t('penjara: gagal 3x wajib bayar $50 lalu jalan; kembar bebas tanpa lempar lagi',()=>{
  const S=game(2);S.own.fill(1);S.mort.fill(1);
  const p=S.players[0];p.pos=10;p.jail=1;
  for(let k=0;k<2;k++){dice(1,2);ok(S,0,{t:'roll'});assert.strictEqual(p.pos,10);ok(S,0,{t:'end'});ok(S,1,{t:'end'===0?'':'roll'});S.step='end';S.again=false;ok(S,1,{t:'end'})}
  dice(1,2);ok(S,0,{t:'roll'});
  assert.strictEqual(p.jail,0);assert.strictEqual(p.pos,13);assert.strictEqual(p.cash,1450);
  p.pos=10;p.jail=1;S.turn=0;S.step='roll';dice(3,3);ok(S,0,{t:'roll'});
  assert.strictEqual(p.pos,16);assert.strictEqual(who(S).k,'end');
  p.pos=10;p.jail=1;S.turn=0;S.step='roll';ok(S,0,{t:'jpay'});assert.strictEqual(p.jail,0);assert.strictEqual(p.cash,1400);
});
t('petak Ditangkap -> penjara, tanpa $200',()=>{
  const S=game(2);S.players[0].pos=27;dice(1,2);ok(S,0,{t:'roll'});
  assert.strictEqual(S.players[0].pos,10);assert.strictEqual(S.players[0].jail,1);assert.strictEqual(S.players[0].cash,1500);
});
t('bangun: butuh set lengkap, merata, stok; jual merata; gadai butuh tanpa bangunan',()=>{
  const S=game(2);S.own[37]=0;
  no(S,0,{t:'build',pos:37});S.own[39]=0;
  ok(S,0,{t:'build',pos:37});no(S,0,{t:'build',pos:37});ok(S,0,{t:'build',pos:39});
  assert.strictEqual(S.players[0].cash,1100);assert.strictEqual(S.houses,30);
  no(S,0,{t:'mort',pos:39});
  S.players[0].cash=5000;for(let k=0;k<4;k++){ok(S,0,{t:'build',pos:37});ok(S,0,{t:'build',pos:39})}
  assert.strictEqual(S.lvl[37],5);assert.strictEqual(S.hotels,10);assert.strictEqual(S.houses,32);
  no(S,0,{t:'build',pos:37});
  ok(S,0,{t:'sell',pos:37});assert.strictEqual(S.lvl[37],4);assert.strictEqual(S.houses,28);
  no(S,0,{t:'sell',pos:37});ok(S,0,{t:'sell',pos:39});
  S.lvl[37]=S.lvl[39]=0;ok(S,0,{t:'mort',pos:39});no(S,0,{t:'build',pos:37});
  const c=S.players[0].cash;ok(S,0,{t:'unmort',pos:39});assert.strictEqual(S.players[0].cash,c-220);
});
t('lelang: penawar tertinggi menang saat yang lain lewat',()=>{
  const S=game(3);dice(1,2);ok(S,0,{t:'roll'});ok(S,0,{t:'auc'});
  assert.strictEqual(who(S).k,'auc');
  ok(S,1,{t:'bid',amt:10});no(S,2,{t:'bid',amt:10});ok(S,2,{t:'bid',amt:30});
  no(S,2,{t:'pass'});ok(S,0,{t:'pass'});ok(S,1,{t:'pass'});
  assert.strictEqual(S.own[3],2);assert.strictEqual(S.players[2].cash,1470);assert.strictEqual(who(S).k,'end');
});
t('lelang tanpa tawaran: tetap milik bank',()=>{
  const S=game(2);dice(1,2);ok(S,0,{t:'roll'});ok(S,0,{t:'auc'});ok(S,0,{t:'pass'});ok(S,1,{t:'pass'});
  assert.strictEqual(S.own[3],-1);assert.strictEqual(S.auc,null);
});
t('utang -> bangkrut ke pemain: aset pindah, pemenang ditentukan',()=>{
  const S=game(2);S.own[39]=1;S.lvl[39]=5;S.own[37]=1;S.lvl[37]=5;S.own[1]=0;
  const p=S.players[0];p.cash=100;p.pos=36;dice(1,2);ok(S,0,{t:'roll'});
  assert.deepStrictEqual(who(S),{k:'debt',p:0});no(S,0,{t:'pay'});no(S,1,{t:'bust'});
  ok(S,0,{t:'bust'});
  assert.strictEqual(S.phase,'over');assert.strictEqual(S.winner,1);assert.strictEqual(S.own[1],1);assert.strictEqual(S.players[1].cash,1600);
});
t('bangkrut ke bank: properti dilelang',()=>{
  const S=game(3);S.own[1]=0;S.own[3]=0;S.lvl[1]=S.lvl[3]=2;S.houses=28;
  const p=S.players[0];p.cash=10;p.pos=2;dice(1,1);ok(S,0,{t:'roll'}); // pajak 200
  ok(S,0,{t:'sell',pos:1});assert.strictEqual(p.cash,35);
  ok(S,0,{t:'bust'});
  assert.strictEqual(S.houses,32);assert.strictEqual(S.auc.pos,1);assert.deepStrictEqual(S.aucQ,[3]);assert.strictEqual(S.turn,1);
  ok(S,1,{t:'pass'});ok(S,2,{t:'bid',amt:5});assert.strictEqual(S.own[1],2);assert.strictEqual(S.auc.pos,3);
});
t('tukar: properti + uang + biaya 10% properti gadai',()=>{
  const S=game(2);S.own[1]=0;S.own[5]=1;S.mort[5]=1;
  ok(S,0,{t:'trade',to:1,give:[1],get:[5],cash:100,gjc:0,rjc:0});
  no(S,0,{t:'tyes'});ok(S,1,{t:'tyes'});
  assert.strictEqual(S.own[1],1);assert.strictEqual(S.own[5],0);
  assert.strictEqual(S.players[0].cash,1500-100-10);assert.strictEqual(S.players[1].cash,1600);
  no(S,0,{t:'trade',to:1,give:[1],get:[],cash:0});no(S,0,{t:'trade',to:0,give:[5],get:[],cash:0});
  no(S,0,{t:'trade',to:1,give:[],get:[],cash:9999});
});
t('kartu: stasiun terdekat 2x, mundur 3, bebas penjara, bayar tiap pemain',()=>{
  const S=game(3);const rrK=CARDS.n.findIndex(c=>c[1]==='rr');
  S.own[15]=1;S.decks.n.unshift(rrK);S.players[0].pos=5;dice(1,1);ok(S,0,{t:'roll'}); // ke 7 Nasib -> stasiun 15
  assert.strictEqual(S.players[0].pos,15);assert.strictEqual(S.players[0].cash,1450);
  const S2=game(2);S2.decks.n.unshift(CARDS.n.findIndex(c=>c[1]==='back'));S2.players[0].pos=5;dice(1,1);ok(S2,0,{t:'roll'});
  assert.strictEqual(S2.players[0].pos,4);assert.strictEqual(S2.players[0].cash,1300);
  const S3=game(2);const jk=CARDS.n.findIndex(c=>c[1]==='jc');S3.decks.n=S3.decks.n.filter(k=>k!==jk);S3.decks.n.unshift(jk);
  S3.players[0].pos=5;dice(1,1);ok(S3,0,{t:'roll'});
  assert.deepStrictEqual(S3.players[0].jc,['n']);assert.strictEqual(S3.decks.n.length,15);
  const p=S3.players[0];p.jail=1;p.pos=10;S3.turn=0;S3.step='roll';ok(S3,0,{t:'jcard'});
  assert.strictEqual(p.jail,0);assert.strictEqual(S3.decks.n.length,16);
  const S4=game(3);S4.decks.n.unshift(CARDS.n.findIndex(c=>c[1]==='each'));S4.players[0].pos=5;dice(1,1);ok(S4,0,{t:'roll'});
  assert.deepStrictEqual(S4.players.map(p=>p.cash),[1400,1550,1550]);
});
t('host mengeluarkan pemain di tengah lelang/giliran',()=>{
  const S=game(3);dice(1,2);ok(S,0,{t:'roll'});ok(S,0,{t:'auc'});ok(S,1,{t:'bid',amt:20});
  kick(S,1);assert.strictEqual(S.auc.by,-1);ok(S,0,{t:'pass'});ok(S,2,{t:'pass'});assert.strictEqual(S.auc,null);
  kick(S,0);assert.strictEqual(S.phase,'over');assert.strictEqual(S.winner,2);
});

// ---------- fuzz ----------
function check(S,tag){
  const P=S.players;
  P.forEach((p,i)=>{assert.ok(Number.isInteger(p.cash)&&p.cash>=0,tag+' cash '+p.cash);assert.ok(p.pos>=0&&p.pos<40,tag+' pos')});
  let h=0,H=0;
  S.own.forEach((o,q)=>{
    assert.ok(o>=-1&&o<P.length);if(o>=0)assert.ok(!P[o].out,tag+' pemilik bangkrut');
    const l=S.lvl[q];if(l){assert.strictEqual(B[q].t,'p');if(l===5)H++;else h+=l}
    if(o<0)assert.ok(!l&&!S.mort[q],tag+' properti bank tak bersih');
  });
  assert.strictEqual(S.houses+h,32,tag+' stok rumah');assert.strictEqual(S.hotels+H,12,tag+' stok hotel');
  for(let g=0;g<8;g++){const L=grp(g).map(q=>S.lvl[q]);
    if(Math.max(...L)){assert.ok(Math.max(...L)-Math.min(...L)<=1,tag+' tidak merata');
      const o=S.own[grp(g)[0]];assert.ok(grp(g).every(q=>S.own[q]===o&&!S.mort[q]),tag+' bangunan tanpa set/gadai')}}
  const jc=P.reduce((a,p)=>a+p.jc.length,0);
  assert.strictEqual(S.decks.n.length+S.decks.k.length+jc,32,tag+' jumlah kartu');
  const w=who(S);
  if(w.p!==undefined)assert.ok(!P[w.p].out,tag+' menunggu pemain bangkrut');
  if(S.phase==='play')assert.ok(P.filter(p=>!p.out).length>=2);
  S.debts.forEach(d=>assert.ok(!P[d.f].out&&(d.t<0||!P[d.t].out),tag+' utang yatim'));
  if(S.auc)assert.ok(S.own[S.auc.pos]<0,tag+' lelang properti bertuan');
  JSON.stringify(S);
}
const R=k=>Math.floor(realRand()*k),pick=a=>a[R(a.length)];
function step(S){
  const w=who(S),P=S.players,alive=P.map((p,i)=>i).filter(i=>!P[i].out),mine=i=>S.own.map((o,q)=>o===i?q:-1).filter(q=>q>=0);
  if(realRand()<.08){ // aksi acak dari pemain acak (boleh ditolak)
    const i=R(P.length),q=R(40);
    act(S,i,pick([{t:'roll'},{t:'end'},{t:'buy'},{t:'pay'},{t:'bust'},{t:'build',pos:q},{t:'sell',pos:q},{t:'mort',pos:q},{t:'unmort',pos:q},{t:'tyes'},{t:'tno'},{t:'jpay'},{t:'jcard'},{t:'bid',amt:R(300)},null,{t:'x'},
      {t:'trade',to:R(P.length),give:mine(i).filter(()=>realRand()<.3),get:mine(R(P.length)).filter(()=>realRand()<.3),cash:R(200)-100,gjc:R(2),rjc:R(2)}]));
    return;
  }
  if(S.trade&&realRand()<.5)return void act(S,S.trade.t,{t:realRand()<.5?'tyes':'tno'});
  if(w.k==='debt'){const i=w.p,m=mine(i),r=realRand();
    if(P[i].cash>=S.debts[0].a)return void act(S,i,{t:'pay'});
    if(r<.45&&m.length)return void act(S,i,{t:'sell',pos:pick(m)});
    if(r<.9&&m.length)return void act(S,i,{t:'mort',pos:pick(m)});
    if(!m.some(q=>S.lvl[q]||!S.mort[q])||r>.97)act(S,i,{t:'bust'});
    return}
  if(w.k==='auc'){const i=pick(alive);return void act(S,i,realRand()<.5?{t:'bid',amt:S.auc.bid+1+R(40)}:{t:'pass'})}
  const i=w.p;
  if(w.k==='roll')return void act(S,i,P[i].jail&&realRand()<.3?{t:pick(['jpay','jcard'])}:{t:'roll'});
  if(w.k==='buy')return void act(S,i,{t:realRand()<.8?'buy':'auc'});
  const m=mine(i);
  if(m.length&&realRand()<.6)return void act(S,i,{t:pick(['build','build','build','unmort','mort','sell']),pos:pick(m)});
  act(S,i,{t:'end'});
}
let over=0,maxLog=0;
for(let gI=0;gI<400;gI++){
  const S=game(2+gI%3);let k=0;
  try{for(;k<6000&&S.phase==='play';k++){step(S);check(S,`game ${gI} langkah ${k}`)}}
  catch(e){console.error('GAGAL di game',gI,'langkah',k,'\n',S.log.slice(-8).join('\n'));throw e}
  if(S.phase==='over'){over++;assert.ok(!S.players[S.winner].out)}
}
console.log(`ok fuzz: 400 game, ${over} selesai dengan pemenang`);
console.log(`\n${n+1} tes lolos`);
