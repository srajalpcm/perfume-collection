(function(){
  const byId = id => document.getElementById(id);

  window.startAdd = function(){
    resetForm();
    go('add');
  };

  window.editPerfume = function(id){
    try {
      const p = perfumes.find(x => String(x.id) === String(id));
      if(!p){ toast('Perfume not found','error'); return; }
      editingId = p.id;
      const fields = {
        name:p.name, brand:p.brand, type:p.type, occasion:p.occasion,
        cloneOf:p.cloneOf, imageUrl:p.imageUrl, quantity:p.quantity,
        quantityRemaining:p.quantityRemaining, year:p.year, price:p.price,
        rating:p.rating, topNotes:p.topNotes, heartNotes:p.heartNotes,
        baseNotes:p.baseNotes, accords:p.accords, notes:p.notes
      };
      Object.entries(fields).forEach(([k,v])=>{
        const el = byId(k);
        if(el) el.value = v ?? '';
      });
      const title = byId('formTitle');
      const save = byId('saveBtn');
      if(title) title.textContent = 'Edit perfume';
      if(save) save.textContent = 'Update perfume';
      updateCost();
      go('add');
      setTimeout(()=>byId('perfumeForm')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
    } catch(err){
      console.error(err);
      toast('Could not open perfume for editing.','error');
    }
  };

  window.savePerfume = async function(e){
    e.preventDefault();
    const form = byId('perfumeForm');
    if(!form || !form.reportValidity()) return;
    const q=n(byId('quantity')?.value), r=n(byId('quantityRemaining')?.value);
    if(r>q){ toast('Remaining cannot exceed bottle size','error'); return; }
    const wasEditing=!!editingId;
    const p={
      id:editingId||crypto.randomUUID(),
      name:(byId('name')?.value||'').trim(),
      brand:(byId('brand')?.value||'').trim(),
      type:byId('type')?.value||'', profile:'',
      occasion:byId('occasion')?.value||'',
      cloneOf:(byId('cloneOf')?.value||'').trim(),
      imageUrl:(byId('imageUrl')?.value||'').trim(), quantity:q,
      quantityRemaining:r, year:parseInt(byId('year')?.value||'',10)||'',
      price:n(byId('price')?.value), rating:byId('rating')?.value||'',
      topNotes:(byId('topNotes')?.value||'').trim(),
      heartNotes:(byId('heartNotes')?.value||'').trim(),
      baseNotes:(byId('baseNotes')?.value||'').trim(),
      accords:(byId('accords')?.value||'').trim(), sourceUrl:'',
      notes:(byId('notes')?.value||'').trim()
    };
    const old=perfumes.slice();
    if(wasEditing) perfumes=perfumes.map(x=>String(x.id)===String(p.id)?{...x,...p}:x);
    else perfumes=[...perfumes,p];
    try{
      await saveData();
      toast(wasEditing?'Perfume updated':'Perfume added','success');
      resetForm();
      go('collection');
    }catch(err){
      perfumes=old;
      toast('Could not save: '+(err.message||err),'error');
    }
  };

  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[onclick="go(\'add\')"]').forEach(b=>b.setAttribute('onclick','startAdd()'));
    document.querySelectorAll('[data-mobile="add"]').forEach(b=>b.setAttribute('onclick','startAdd()'));
  });
})();
