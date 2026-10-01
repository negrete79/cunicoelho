/* ============================================================
   VIP-CODES.JS — Lepus Negret's
   Códigos universais válidos (decodificados):
   LNPREM-MARIA-8214
   LNPREM-JOAO-4692
   LNPREM-NEGRET-002147
   (armazenados em base64 para não ficarem legíveis no código-fonte)
   ============================================================ */
const _0x = [
  "TE5QUkVNLU1BUklBLTgyMTQ=",   /* LNPREM-MARIA-8214      */
  "TE5QUkVNLUpPQU9NNDZ5Mg==",   /* LNPREM-JOAO-4692       */
  "TE5QUkVNLU5FR1JFVC0wMDIxNDc=" /* LNPREM-NEGRET-002147  */
];
window.validarCodigoExterno = function(c){
  try{
    const h = String(c || "").trim().toUpperCase().split("").reverse().join("");
    return _0x.map(function(s){
      return atob(s).split("").reverse().join("");
    }).includes(h);
  }catch(e){ return false }
};
