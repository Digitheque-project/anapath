'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

export default function NouvelExamenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [anaType, setAnaType] = useState('fcv');
  const [urgence, setUrgence] = useState('n');
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [showCytoFixateurAutre, setShowCytoFixateurAutre] = useState(false);
  const [showLiqNatureAutre, setShowLiqNatureAutre] = useState(false);
  const [showBioNatureAutre, setShowBioNatureAutre] = useState(false);
  
  const [formData, setFormData] = useState({
    serviceDemandeur: '',
    renseignementsCliniques: '',
    precautions: '',
    
    fcvGpa: '',
    fcvDdr: '',
    fcvMenopause: '',
    fcvMenarche: '',
    fcvPremierRapport: '',
    fcvContraception: '',
    fcvTraitement: '',
    fcvExamensAnterieursLieu: '',
    fcvExamensAnterieursNombre: '',
    fcvExamensAnterieursDate: '',
    fcvExamensAnterieursResultat: '',
    fcvAntecedents: '',
    fcvMethode: 'Spatule + brosse',
    fcvSymptomes: '',
    
    cytoSiege: '',
    cytoOrgane: '',
    cytoFixateur: 'Cytofixe',
    cytoFixateurAutre: '',
    cytoNotes: '',
    
    liqUniteSoins: '',
    liqNature: '',
    liqNatureAutre: '',
    liqNotes: '',
    
    bioExamensAnterieurs: '',
    bioResultatsAnterieurs: '',
    bioGpa: '',
    bioDdr: '',
    bioMenopause: '',
    bioAntecedents: '',
    bioDatePrelevement: '',
    bioFixateur: '',
    bioOrgane: '',
    bioNature: 'Biopsie',
    bioNatureAutre: '',
    bioSuspicion: '',
    bioFaitA: '',
    bioLe: '',
    
    extChirurgien: '',
    extPosteTel: '',
    extIntervention: '',
    extNature: 'Tissu frais (histologique)',
    extOrgane: '',
    extQuestion: '',
    extHeure: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleCytoFixateurChange = (value: string) => {
    setFormData(prev => ({ ...prev, cytoFixateur: value }));
    setShowCytoFixateurAutre(value === 'Autre');
    if (value !== 'Autre') {
      setFormData(prev => ({ ...prev, cytoFixateurAutre: '' }));
    }
  };

  const handleLiqNatureChange = (value: string) => {
    setFormData(prev => ({ ...prev, liqNature: value }));
    setShowLiqNatureAutre(value === 'Autre');
    if (value !== 'Autre') {
      setFormData(prev => ({ ...prev, liqNatureAutre: '' }));
    }
  };

  const handleBioNatureChange = (value: string) => {
    setFormData(prev => ({ ...prev, bioNature: value }));
    setShowBioNatureAutre(value === 'Autre');
    if (value !== 'Autre') {
      setFormData(prev => ({ ...prev, bioNatureAutre: '' }));
    }
  };

  const getTypeLabel = () => {
    switch (anaType) {
      case 'bio': return 'Biopsie';
      case 'pos': return 'POS';
      case 'poc': return 'POC';
      default: return 'Biopsie';
    }
  };

  const isBioType = () => {
    return anaType === 'bio' || anaType === 'pos' || anaType === 'poc';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let typeExamen = 'BIOPSIE';
      let prelevement = { site: 'Site de prélèvement', description: 'Description du prélèvement' };
      
      switch (anaType) {
        case 'fcv':
          typeExamen = 'FCV_PAP';
          prelevement = {
            site: 'Col utérin',
            description: `GPA: ${formData.fcvGpa}, DDR: ${formData.fcvDdr}, Méthode: ${formData.fcvMethode}, Symptômes: ${formData.fcvSymptomes}`
          };
          break;
        case 'cyto':
          typeExamen = 'CYT0PONCTION';
          prelevement = {
            site: formData.cytoSiege || 'Non spécifié',
            description: `Organe: ${formData.cytoOrgane}, Fixateur: ${formData.cytoFixateur === 'Autre' ? formData.cytoFixateurAutre : formData.cytoFixateur}`
          };
          break;
        case 'liq':
          typeExamen = 'LIQUIDE';
          prelevement = {
            site: 'Liquide biologique',
            description: `Nature: ${formData.liqNature === 'Autre' ? formData.liqNatureAutre : formData.liqNature}, Notes: ${formData.liqNotes}`
          };
          break;
        case 'bio':
        case 'pos':
        case 'poc':
          typeExamen = 'BIOPSIE';
          prelevement = {
            site: formData.bioOrgane || 'Non spécifié',
            description: `Type: ${getTypeLabel()}, Fixateur: ${formData.bioFixateur}, Nature: ${formData.bioNature}`
          };
          break;
        case 'ext':
          typeExamen = 'EXTEMPORANE_STAT';
          prelevement = {
            site: formData.extOrgane || 'Non spécifié',
            description: `Chirurgien: ${formData.extChirurgien}, Question: ${formData.extQuestion}`
          };
          break;
      }
      
      const apiData = {
        patientId: `TEMP-${Date.now()}`,
        typeExamen: typeExamen,
        isExtemporane: anaType === 'ext',
        prelevement: prelevement,
      };
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anapath`, apiData);
      
      if (response.status === 201) {
        alert(`✅ Demande créée ! ID: ${response.data.anapathId}`);
        router.push('/worklist');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f2f7]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        
        {/* Header - Sans icône person */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00478d] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">biotech</span>
            </div>
            <h1 className="font-bold text-[#00478d]">Nouvelle demande - Anatomie Pathologique</h1>
          </div>
          {/* Icône person supprimée */}
        </header>
        
        <div className="flex-1 p-6 w-full max-w-4xl mx-auto">
          
          {/* En-tête patient */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden sticky top-16 z-40">
            <div className="px-5 py-4 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="bg-[#00478d] text-white px-4 py-2 rounded-lg font-mono text-sm font-bold">IP-2025-04872</div>
                <div>
                  <p className="font-bold text-lg text-gray-800">RAKOTO Jean-Pierre</p>
                  <p className="text-sm text-gray-500">38 ans • M • Hospitalisation — Médecine interne</p>
                </div>
              </div>
              <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 border border-amber-200">
                <span className="material-symbols-outlined text-sm">warning</span> Allergie : Pénicilline
              </div>
            </div>
          </div>

          {/* Degré d'urgence */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Degré d'urgence <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'n', label: 'Normal', icon: 'check_circle', bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
                { value: 'u', label: 'Urgent', icon: 'warning', bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
                { value: 'tu', label: 'STAT (Extemporané)', icon: 'emergency', bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUrgence(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    urgence === option.value ? `${option.bg} ${option.border} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${urgence === option.value ? option.text : 'text-gray-500'}`}>{option.icon}</span>
                  <span className={`font-semibold text-sm ${urgence === option.value ? option.text : 'text-gray-600'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Précautions & Alertes */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Précautions &amp; Alertes</label>
            <textarea name="precautions" value={formData.precautions} onChange={handleChange} rows={2} className="w-full border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-sm" placeholder="Risque infectieux, précautions particulières..." />
          </div>

          {/* Renseignements cliniques */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Renseignements cliniques <span className="text-red-500">*</span></label>
            <textarea
              name="renseignementsCliniques"
              value={formData.renseignementsCliniques}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 bg-white"
              placeholder="Contexte clinique, suspicion diagnostique, résultats d'imagerie..."
            />
          </div>

          {/* Type d'examen */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Type d'examen <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'fcv', label: 'FCV / Pap test' },
                { id: 'cyto', label: 'Cytoponction' },
                { id: 'liq', label: 'Liquide' },
                { id: 'bio', label: 'Biopsie' },
                { id: 'pos', label: 'POS' },
                { id: 'poc', label: 'POC' },
                { id: 'ext', label: 'Extemporané' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setAnaType(type.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    anaType === type.id ? 'bg-[#00478d] text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* FCV */}
          {anaType === 'fcv' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">FCV / Pap test — Informations personnelles rattachées via l'ID.</div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité / Service demandeur</label>
                <input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service clinique prescripteur" />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-[#00478d] mb-4">Antécédents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">G P A</label><input name="fcvGpa" value={formData.fcvGpa} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : G3 P2 A1" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">DDR</label><input name="fcvDdr" value={formData.fcvDdr} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" type="date" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ménopause</label><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="fcvMenopause" value="OUI" checked={formData.fcvMenopause === 'OUI'} onChange={handleChange} /> OUI</label><label className="flex items-center gap-2"><input type="radio" name="fcvMenopause" value="NON" checked={formData.fcvMenopause === 'NON'} onChange={handleChange} /> NON</label></div></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Âge de la ménarche</label><input name="fcvMenarche" value={formData.fcvMenarche} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Âge (ans)" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Âge du 1er rapport sexuel</label><input name="fcvPremierRapport" value={formData.fcvPremierRapport} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Âge (ans)" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contraception</label><input name="fcvContraception" value={formData.fcvContraception} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Méthode, durée..." /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Traitement en cours</label><input name="fcvTraitement" value={formData.fcvTraitement} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Médicaments..." /></div>
                </div>
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Examens Pap test antérieurs</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><input name="fcvExamensAnterieursLieu" value={formData.fcvExamensAnterieursLieu} onChange={handleChange} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Lieu" /><input name="fcvExamensAnterieursNombre" value={formData.fcvExamensAnterieursNombre} onChange={handleChange} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Nombre" /><input name="fcvExamensAnterieursDate" value={formData.fcvExamensAnterieursDate} onChange={handleChange} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" type="date" /><input name="fcvExamensAnterieursResultat" value={formData.fcvExamensAnterieursResultat} onChange={handleChange} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Résultat" /></div></div>
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Autres antécédents</label><textarea name="fcvAntecedents" value={formData.fcvAntecedents} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Précisez..." /></div>
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Méthode de prélèvement</label><div className="flex gap-4"><label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${formData.fcvMethode === 'Spatule + brosse' ? 'bg-[#00478d] text-white' : 'bg-gray-100'}`}><input type="radio" name="fcvMethode" value="Spatule + brosse" checked={formData.fcvMethode === 'Spatule + brosse'} onChange={handleChange} className="hidden" /> Spatule + brosse</label><label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${formData.fcvMethode === 'Milieu liquide (ThinPrep)' ? 'bg-[#00478d] text-white' : 'bg-gray-100'}`}><input type="radio" name="fcvMethode" value="Milieu liquide (ThinPrep)" checked={formData.fcvMethode === 'Milieu liquide (ThinPrep)'} onChange={handleChange} className="hidden" /> Milieu liquide (ThinPrep)</label></div></div>
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Symptomatologie actuelle</label><textarea name="fcvSymptomes" value={formData.fcvSymptomes} onChange={handleChange} rows={3} className="w-full rounded-xl px-4 py-2.5 text-sm border border-gray-200" placeholder="Signes cliniques, motif de la demande..." /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold">{loading ? 'ENVOI EN COURS...' : 'VALIDER LA PRESCRIPTION'}</button>
            </form>
          )}

          {/* Cytoponction */}
          {anaType === 'cyto' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">Cytoponction — Informations personnelles rattachées via l'ID patient.</div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité / Service demandeur</label>
                <input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service clinique prescripteur" />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Siège de la ponction</label><input name="cytoSiege" value={formData.cytoSiege} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : sein gauche, creux axillaire..." /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Organe</label><input name="cytoOrgane" value={formData.cytoOrgane} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : thyroïde, ganglion..." /></div>
                </div>
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Fixateur</label><div className="flex gap-6"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cytoFixateur" value="Cytofixe" checked={formData.cytoFixateur === 'Cytofixe'} onChange={(e) => handleCytoFixateurChange(e.target.value)} /> Cytofixe</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cytoFixateur" value="Autre" checked={formData.cytoFixateur === 'Autre'} onChange={(e) => handleCytoFixateurChange(e.target.value)} /> Autre</label></div></div>
                {showCytoFixateurAutre && <div className="mt-3"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Préciser le fixateur</label><input name="cytoFixateurAutre" value={formData.cytoFixateurAutre} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Nom du fixateur utilisé..." /></div>}
                <div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Notes complémentaires</label><textarea name="cytoNotes" value={formData.cytoNotes} onChange={handleChange} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Informations supplémentaires..." /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold">{loading ? 'ENVOI EN COURS...' : 'VALIDER LA PRESCRIPTION'}</button>
            </form>
          )}

          {/* Liquide */}
          {anaType === 'liq' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">Cytologie sur liquide — Informations personnelles rattachées via l'ID patient.</div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité / Service demandeur</label><input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service clinique prescripteur" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité de soins (si hospitalisé)</label><input name="liqUniteSoins" value={formData.liqUniteSoins} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service / Unité" /></div></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nature du liquide</label><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{['Ascite', 'Pleural', 'Urinaire', 'Crachat', 'LCR', 'Autre'].map((option) => (<label key={option} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="liqNature" value={option} checked={formData.liqNature === option} onChange={(e) => handleLiqNatureChange(e.target.value)} /> {option}</label>))}</div></div>
              {showLiqNatureAutre && <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Préciser la nature du liquide</label><input name="liqNatureAutre" value={formData.liqNatureAutre} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Nature du liquide..." /></div>}
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Renseignements cliniques / Notes</label><textarea name="liqNotes" value={formData.liqNotes} onChange={handleChange} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Symptômes, antécédents, résultats d'imagerie, volume prélevé..." /></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold">{loading ? 'ENVOI EN COURS...' : 'VALIDER LA PRESCRIPTION'}</button>
            </form>
          )}

          {/* Biopsie / POS / POC */}
          {isBioType() && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">{getTypeLabel()} — Informations personnelles rattachées via l'ID patient.</div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité / Service demandeur</label><input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service clinique prescripteur" /></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><h3 className="font-bold text-[#00478d] mb-4">Antécédents</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Examens antérieurs</label><input name="bioExamensAnterieurs" value={formData.bioExamensAnterieurs} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Type d'examen" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Résultats</label><input name="bioResultatsAnterieurs" value={formData.bioResultatsAnterieurs} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Résultat" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">G P A</label><input name="bioGpa" value={formData.bioGpa} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : G3 P2 A1" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">DDR</label><input name="bioDdr" value={formData.bioDdr} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" type="date" /></div></div><div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ménopause</label><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="bioMenopause" value="OUI" checked={formData.bioMenopause === 'OUI'} onChange={handleChange} /> OUI</label><label className="flex items-center gap-2"><input type="radio" name="bioMenopause" value="NON" checked={formData.bioMenopause === 'NON'} onChange={handleChange} /> NON</label></div></div><div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Autres antécédents</label><textarea name="bioAntecedents" value={formData.bioAntecedents} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Précisez..." /></div></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><h3 className="font-bold text-[#00478d] mb-4">Prélèvement</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Date du prélèvement</label><input name="bioDatePrelevement" value={formData.bioDatePrelevement} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" type="date" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fixateur</label><select name="bioFixateur" value={formData.bioFixateur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"><option value="">— Sélectionner —</option><option value="Formol 10%">Formol 10%</option><option value="Liquide de Bouin">Liquide de Bouin</option><option value="Alcool">Alcool</option></select></div><div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Organe(s) / Site anatomique</label><input name="bioOrgane" value={formData.bioOrgane} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : colon sigmoïde, sein droit, col utérin..." /></div></div><div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nature du prélèvement</label><div className="grid grid-cols-2 gap-3">{['Biopsie', 'Exérèse', 'Curage ganglionnaire', 'Autre'].map((option) => (<label key={option} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="bioNature" value={option} checked={formData.bioNature === option} onChange={(e) => handleBioNatureChange(e.target.value)} /> {option}</label>))}</div></div>{showBioNatureAutre && <div className="mt-3"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Préciser la nature</label><input name="bioNatureAutre" value={formData.bioNatureAutre} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Préciser..." /></div>}<div className="mt-4"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Suspicion diagnostique</label><textarea name="bioSuspicion" value={formData.bioSuspicion} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Hypothèse(s) diagnostique(s)..." /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fait à</label><input name="bioFaitA" value={formData.bioFaitA} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ville / Établissement" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Le</label><input name="bioLe" value={formData.bioLe} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" type="date" /></div></div></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold">{loading ? 'ENVOI EN COURS...' : 'VALIDER LA PRESCRIPTION'}</button>
            </form>
          )}

          {/* Extemporané */}
          {anaType === 'ext' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-red-600">timer</span><span className="font-bold text-red-700">EXAMEN EXTEMPORANÉ — STAT (intra-opératoire)</span></div><p className="text-sm text-red-800 mb-2">Résultat rendu en <strong>30 min max</strong>. Alerte rouge déclenchée à 25 min si résultat non saisi. Le prélèvement doit être acheminé <strong>à l'état frais (non fixé)</strong> — tout fixateur au formol invalide l'extemporané.</p><div className="flex items-start gap-2 mt-3 p-2 bg-amber-50 rounded-lg"><span className="material-symbols-outlined text-amber-600 text-sm">warning</span><p className="text-xs text-amber-800"><strong>Contre-indication :</strong> Les prélèvements calcifiés ne peuvent pas faire l'objet d'un examen extemporané (coupes au cryostat impossibles).</p></div></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unité / Service demandeur</label><input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Service clinique prescripteur" /></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Chirurgien en salle</label><input name="extChirurgien" value={formData.extChirurgien} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Dr. _______________" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Poste téléphonique du bloc</label><input name="extPosteTel" value={formData.extPosteTel} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : 2741 — résultat communiqué par téléphone" /></div></div></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Type d'intervention chirurgicale en cours</label><input name="extIntervention" value={formData.extIntervention} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : Thyroïdectomie, résection tumorale côlon, mastectomie..." /></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nature du prélèvement</label><div className="flex gap-6"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="extNature" value="Tissu frais (histologique)" checked={formData.extNature === 'Tissu frais (histologique)'} onChange={handleChange} className="accent-[#00478d]" /> Tissu frais (histologique)</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="extNature" value="Cytologique (cytoponction, apposition, liquide)" checked={formData.extNature === 'Cytologique (cytoponction, apposition, liquide)'} onChange={handleChange} className="accent-[#00478d]" /> Cytologique (cytoponction, apposition, liquide)</label></div></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Organe / Site anatomique prélevé</label><input name="extOrgane" value={formData.extOrgane} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : sein gauche, thyroïde, ganglion sentinelle..." /></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Question clinique posée au pathologiste</label><textarea name="extQuestion" value={formData.extQuestion} onChange={handleChange} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex : Marge de résection saine ? Lésion bénigne ou maligne ?" /><p className="text-xs text-gray-400 mt-2 italic">Le pathologiste limite sa réponse à ce qui guide le chirurgien en cours d'intervention.</p></div>
              <div className="bg-white rounded-xl shadow-sm border p-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Heure de prélèvement</label><input name="extHeure" value={formData.extHeure} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" type="time" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Délai maximal attendu</label><input type="text" value="30 minutes" readOnly className="w-full rounded-xl px-4 py-2.5 text-sm bg-red-50 text-red-700 font-bold border border-red-200" /></div></div></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold">{loading ? 'ENVOI EN COURS...' : 'VALIDER LA PRESCRIPTION'}</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}