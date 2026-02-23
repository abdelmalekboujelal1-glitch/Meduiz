import React, { useState } from 'react';
import { Calculator, ChevronRight, ArrowLeft, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CalculatorField {
  label: string;
  name: string;
  type: 'number' | 'select';
  unit?: string;
  options?: { label: string; value: string | number }[];
  placeholder?: string;
}

interface CalculatorDefinition {
  id: string;
  name: string;
  category: string;
  fields: CalculatorField[];
  calculate: (values: Record<string, any>) => { result: string; interpretation: string; formula: string };
}

const CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'bmi',
    name: 'IMC (Indice de Masse Corporelle)',
    category: 'Anthropométrie',
    fields: [
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg', placeholder: 'ex: 70' },
      { label: 'Taille', name: 'height', type: 'number', unit: 'cm', placeholder: 'ex: 175' },
    ],
    calculate: (values) => {
      const w = parseFloat(values.weight);
      const h = parseFloat(values.height) / 100;
      if (!w || !h) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Poids / Taille²' };
      const bmi = w / (h * h);
      let interp = '';
      if (bmi < 18.5) interp = 'Insuffisance pondérale';
      else if (bmi < 25) interp = 'Poids normal';
      else if (bmi < 30) interp = 'Surpoids';
      else interp = 'Obésité';
      return { 
        result: bmi.toFixed(1) + ' kg/m²', 
        interpretation: interp,
        formula: `${w} / (${h} * ${h}) = ${bmi.toFixed(1)}`
      };
    }
  },
  {
    id: 'ibw',
    name: 'Poids Idéal (IBW)',
    category: 'Anthropométrie',
    fields: [
      { label: 'Taille', name: 'height', type: 'number', unit: 'cm' },
      { label: 'Sexe', name: 'sex', type: 'select', options: [{ label: 'Homme', value: 'male' }, { label: 'Femme', value: 'female' }] },
    ],
    calculate: (values) => {
      const h = parseFloat(values.height);
      const sex = values.sex;
      if (!h || !sex) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Devine (H) or Robinson (F)' };
      let ibw = 0;
      const hInches = h / 2.54;
      if (sex === 'male') {
        ibw = 50 + 2.3 * (hInches - 60);
      } else {
        ibw = 45.5 + 2.3 * (hInches - 60);
      }
      return {
        result: ibw.toFixed(1) + ' kg',
        interpretation: 'Poids idéal théorique pour la taille donnée.',
        formula: sex === 'male' ? `50 + 2.3 * (${hInches.toFixed(1)} - 60)` : `45.5 + 2.3 * (${hInches.toFixed(1)} - 60)`
      };
    }
  },
  {
    id: 'bsa',
    name: 'Surface Corporelle (BSA)',
    category: 'Anthropométrie',
    fields: [
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
      { label: 'Taille', name: 'height', type: 'number', unit: 'cm' },
    ],
    calculate: (values) => {
      const w = parseFloat(values.weight);
      const h = parseFloat(values.height);
      if (!w || !h) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '√(Poids * Taille / 3600)' };
      const bsa = Math.sqrt((w * h) / 3600);
      return {
        result: bsa.toFixed(2) + ' m²',
        interpretation: 'Surface corporelle totale (Formule de Mosteller).',
        formula: `√(${w} * ${h} / 3600) = ${bsa.toFixed(2)}`
      };
    }
  },
  {
    id: 'caloric_needs',
    name: 'Besoins Caloriques Journaliers',
    category: 'Anthropométrie',
    fields: [
      { label: 'Âge', name: 'age', type: 'number', unit: 'ans' },
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
      { label: 'Taille', name: 'height', type: 'number', unit: 'cm' },
      { label: 'Sexe', name: 'sex', type: 'select', options: [{ label: 'Homme', value: 'male' }, { label: 'Femme', value: 'female' }] },
      { 
        label: 'Activité', 
        name: 'activity', 
        type: 'select', 
        options: [
          { label: 'Sédentaire', value: 1.2 },
          { label: 'Légère', value: 1.375 },
          { label: 'Modérée', value: 1.55 },
          { label: 'Intense', value: 1.725 },
          { label: 'Très intense', value: 1.9 },
        ] 
      },
    ],
    calculate: (values) => {
      const { age, weight, height, sex, activity } = values;
      const a = parseFloat(age);
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const act = parseFloat(activity);
      if (!a || !w || !h || !sex || !act) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Harris-Benedict' };
      
      let bmr = 0;
      if (sex === 'male') {
        bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
      } else {
        bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
      }
      const total = bmr * act;
      return {
        result: Math.round(total) + ' kcal/jour',
        interpretation: `Métabolisme de base: ${Math.round(bmr)} kcal. Total avec activité: ${Math.round(total)} kcal.`,
        formula: `BMR * Niveau d'activité = ${Math.round(total)}`
      };
    }
  },
  {
    id: 'gfr',
    name: 'DFG (Cockcroft-Gault)',
    category: 'Rénal',
    fields: [
      { label: 'Âge', name: 'age', type: 'number', unit: 'ans' },
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
      { label: 'Créatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { label: 'Sexe', name: 'sex', type: 'select', options: [{ label: 'Homme', value: 'male' }, { label: 'Femme', value: 'female' }] },
    ],
    calculate: (values) => {
      const { age, weight, creatinine, sex } = values;
      const a = parseFloat(age);
      const w = parseFloat(weight);
      const c = parseFloat(creatinine);
      if (!a || !w || !c) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '((140 - âge) * poids) / (72 * créat)' };
      
      let gfr = ((140 - a) * w) / (72 * c);
      if (sex === 'female') gfr *= 0.85;
      
      let interp = '';
      if (gfr >= 90) interp = 'Normal ou élevé';
      else if (gfr >= 60) interp = 'Diminution légère';
      else if (gfr >= 30) interp = 'Diminution modérée';
      else if (gfr >= 15) interp = 'Diminution sévère';
      else interp = 'Insuffisance rénale terminale';

      return {
        result: gfr.toFixed(1) + ' mL/min',
        interpretation: interp,
        formula: `((140 - ${a}) * ${w}) / (72 * ${c}) ${sex === 'female' ? '* 0.85' : ''} = ${gfr.toFixed(1)}`
      };
    }
  },
  {
    id: 'map',
    name: 'PAM (Pression Artérielle Moyenne)',
    category: 'Cardiovasculaire',
    fields: [
      { label: 'Systolique', name: 'systolic', type: 'number', unit: 'mmHg' },
      { label: 'Diastolique', name: 'diastolic', type: 'number', unit: 'mmHg' },
    ],
    calculate: (values) => {
      const s = parseFloat(values.systolic);
      const d = parseFloat(values.diastolic);
      if (!s || !d) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '(PAS + 2*PAD) / 3' };
      const map = (s + 2 * d) / 3;
      return {
        result: map.toFixed(0) + ' mmHg',
        interpretation: map >= 65 ? 'Perfusion adéquate' : 'Hypoperfusion possible',
        formula: `(${s} + 2 * ${d}) / 3 = ${map.toFixed(0)}`
      };
    }
  },
  {
    id: 'chads2vasc',
    name: 'Score CHA₂DS₂-VASc',
    category: 'Cardiovasculaire',
    fields: [
      { label: 'Âge', name: 'age', type: 'number', unit: 'ans' },
      { label: 'Sexe', name: 'sex', type: 'select', options: [{ label: 'Homme', value: 'male' }, { label: 'Femme', value: 'female' }] },
      { label: 'Insuffisance Cardiaque', name: 'chf', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Hypertension', name: 'htn', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'AVC / AIT / Embolie', name: 'stroke', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 2 }] },
      { label: 'Maladie Vasculaire', name: 'vascular', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Diabète', name: 'diabetes', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
    ],
    calculate: (values) => {
      const age = parseInt(values.age) || 0;
      const sex = values.sex;
      const chf = parseInt(values.chf) || 0;
      const htn = parseInt(values.htn) || 0;
      const stroke = parseInt(values.stroke) || 0;
      const vascular = parseInt(values.vascular) || 0;
      const diabetes = parseInt(values.diabetes) || 0;
      
      let score = chf + htn + stroke + vascular + diabetes;
      if (age >= 75) score += 2;
      else if (age >= 65) score += 1;
      if (sex === 'female') score += 1;

      let interp = '';
      if (score === 0) interp = 'Faible risque (pas d\'anticoagulation)';
      else if (score === 1) interp = 'Risque intermédiaire (anticoagulation à discuter)';
      else interp = 'Risque élevé (anticoagulation recommandée)';

      return {
        result: score.toString(),
        interpretation: interp,
        formula: `CHF(${chf}) + HTN(${htn}) + Age(${age >= 75 ? 2 : (age >= 65 ? 1 : 0)}) + Diab(${diabetes}) + Stroke(${stroke}) + Vasc(${vascular}) + Sex(${sex === 'female' ? 1 : 0}) = ${score}`
      };
    }
  },
  {
    id: 'hasbled',
    name: 'Score HAS-BLED',
    category: 'Cardiovasculaire',
    fields: [
      { label: 'Hypertension (>160)', name: 'h', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Fonction Rénale Anormale', name: 'a_renal', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Fonction Hépatique Anormale', name: 'a_liver', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'AVC', name: 's', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Saignement', name: 'b', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'INR Labile', name: 'l', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Âge > 65 ans', name: 'e', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Drogues (Anti-agrégants/AINS)', name: 'd_drugs', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Alcool', name: 'd_alcohol', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
      let interp = '';
      if (score >= 3) interp = 'Risque de saignement élevé (surveillance étroite)';
      else interp = 'Risque de saignement faible à modéré';
      return {
        result: score.toString(),
        interpretation: interp,
        formula: `Total des points = ${score}`
      };
    }
  },
  {
    id: 'qtc',
    name: 'Intervalle QTc (Bazett)',
    category: 'Cardiovasculaire',
    fields: [
      { label: 'Intervalle QT', name: 'qt', type: 'number', unit: 'ms' },
      { label: 'Fréquence Cardiaque', name: 'hr', type: 'number', unit: 'bpm' },
    ],
    calculate: (values) => {
      const qt = parseFloat(values.qt);
      const hr = parseFloat(values.hr);
      if (!qt || !hr) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'QT / √RR' };
      const rr = 60 / hr;
      const qtc = qt / Math.sqrt(rr);
      return {
        result: qtc.toFixed(0) + ' ms',
        interpretation: qtc > 440 ? 'Allongement du QT (Risque d\'arythmie)' : 'Normal',
        formula: `${qt} / √(${rr.toFixed(2)}) = ${qtc.toFixed(0)}`
      };
    }
  },
  {
    id: 'pf_ratio',
    name: 'Rapport PaO₂/FiO₂',
    category: 'Respiratoire',
    fields: [
      { label: 'PaO₂', name: 'pao2', type: 'number', unit: 'mmHg' },
      { label: 'FiO₂', name: 'fio2', type: 'number', unit: '%', placeholder: 'ex: 21' },
    ],
    calculate: (values) => {
      const pao2 = parseFloat(values.pao2);
      const fio2 = parseFloat(values.fio2) / 100;
      if (!pao2 || !fio2) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'PaO₂ / FiO₂' };
      const ratio = pao2 / fio2;
      let interp = '';
      if (ratio <= 100) interp = 'SDRA Sévère';
      else if (ratio <= 200) interp = 'SDRA Modéré';
      else if (ratio <= 300) interp = 'SDRA Léger';
      else interp = 'Normal';
      return {
        result: ratio.toFixed(0),
        interpretation: interp,
        formula: `${pao2} / ${fio2.toFixed(2)} = ${ratio.toFixed(0)}`
      };
    }
  },
  {
    id: 'fena',
    name: 'FENa (Excrétion Fractionnelle du Sodium)',
    category: 'Rénal',
    fields: [
      { label: 'Sodium Sérique', name: 'sna', type: 'number', unit: 'mEq/L' },
      { label: 'Sodium Urinaire', name: 'una', type: 'number', unit: 'mEq/L' },
      { label: 'Créatinine Sérique', name: 'scr', type: 'number', unit: 'mg/dL' },
      { label: 'Créatinine Urinaire', name: 'ucr', type: 'number', unit: 'mg/dL' },
    ],
    calculate: (values) => {
      const sna = parseFloat(values.sna);
      const una = parseFloat(values.una);
      const scr = parseFloat(values.scr);
      const ucr = parseFloat(values.ucr);
      if (!sna || !una || !scr || !ucr) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '(UNa * SCr) / (SNa * UCr) * 100' };
      const fena = (una * scr) / (sna * ucr) * 100;
      let interp = '';
      if (fena < 1) interp = 'Prérénale (Hypovolémie)';
      else if (fena > 2) interp = 'Nécrose Tubulaire Aiguë (NTA)';
      else interp = 'Indéterminé';
      return {
        result: fena.toFixed(2) + ' %',
        interpretation: interp,
        formula: `(${una} * ${scr}) / (${sna} * ${ucr}) * 100 = ${fena.toFixed(2)}%`
      };
    }
  },
  {
    id: 'osmolality',
    name: 'Osmolalité Sérique Calculée',
    category: 'Rénal',
    fields: [
      { label: 'Sodium', name: 'na', type: 'number', unit: 'mEq/L' },
      { label: 'Glucose', name: 'glu', type: 'number', unit: 'mg/dL' },
      { label: 'Urée (BUN)', name: 'bun', type: 'number', unit: 'mg/dL' },
    ],
    calculate: (values) => {
      const na = parseFloat(values.na);
      const glu = parseFloat(values.glu);
      const bun = parseFloat(values.bun);
      if (!na || !glu || !bun) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '2*Na + Glu/18 + BUN/2.8' };
      const osmo = 2 * na + glu / 18 + bun / 2.8;
      return {
        result: osmo.toFixed(1) + ' mOsm/kg',
        interpretation: (osmo >= 275 && osmo <= 295) ? 'Normal' : 'Anormal',
        formula: `2*${na} + ${glu}/18 + ${bun}/2.8 = ${osmo.toFixed(1)}`
      };
    }
  },
  {
    id: 'anion_gap',
    name: 'Trou Anionique (AG)',
    category: 'Biochimie',
    fields: [
      { label: 'Sodium', name: 'na', type: 'number', unit: 'mEq/L' },
      { label: 'Chlore', name: 'cl', type: 'number', unit: 'mEq/L' },
      { label: 'Bicarbonate (HCO₃)', name: 'hco3', type: 'number', unit: 'mEq/L' },
    ],
    calculate: (values) => {
      const na = parseFloat(values.na);
      const cl = parseFloat(values.cl);
      const hco3 = parseFloat(values.hco3);
      if (!na || !cl || !hco3) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Na - (Cl + HCO₃)' };
      const ag = na - (cl + hco3);
      return {
        result: ag.toFixed(1) + ' mEq/L',
        interpretation: ag > 12 ? 'Trou anionique élevé (Acidose métabolique)' : 'Normal',
        formula: `${na} - (${cl} + ${hco3}) = ${ag.toFixed(1)}`
      };
    }
  },
  {
    id: 'ganzoni',
    name: 'Déficit en Fer (Ganzoni)',
    category: 'Biochimie',
    fields: [
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
      { label: 'Hb Actuelle', name: 'hb_act', type: 'number', unit: 'g/dL' },
      { label: 'Hb Cible', name: 'hb_target', type: 'number', unit: 'g/dL', placeholder: 'ex: 15' },
    ],
    calculate: (values) => {
      const w = parseFloat(values.weight);
      const hba = parseFloat(values.hb_act);
      const hbt = parseFloat(values.hb_target);
      if (!w || !hba || !hbt) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Poids * (Hb Cible - Hb Actuelle) * 2.4 + 500' };
      
      const deficit = w * (hbt - hba) * 2.4 + 500;
      return {
        result: Math.round(deficit) + ' mg',
        interpretation: 'Déficit total en fer (incluant les réserves).',
        formula: `${w} * (${hbt} - ${hba}) * 2.4 + 500 = ${Math.round(deficit)}`
      };
    }
  },
  {
    id: 'ldl',
    name: 'LDL Cholestérol (Friedewald)',
    category: 'Biochimie',
    fields: [
      { label: 'Cholestérol Total', name: 'tc', type: 'number', unit: 'mg/dL' },
      { label: 'HDL', name: 'hdl', type: 'number', unit: 'mg/dL' },
      { label: 'Triglycérides', name: 'tg', type: 'number', unit: 'mg/dL' },
    ],
    calculate: (values) => {
      const tc = parseFloat(values.tc);
      const hdl = parseFloat(values.hdl);
      const tg = parseFloat(values.tg);
      if (!tc || !hdl || !tg) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'CT - HDL - (TG / 5)' };
      if (tg > 400) return { result: 'Invalide', interpretation: 'La formule de Friedewald n\'est pas valide si TG > 400 mg/dL', formula: 'TG > 400' };
      
      const ldl = tc - hdl - (tg / 5);
      return {
        result: ldl.toFixed(1) + ' mg/dL',
        interpretation: ldl > 160 ? 'Élevé' : (ldl > 130 ? 'Limite' : 'Normal'),
        formula: `${tc} - ${hdl} - (${tg} / 5) = ${ldl.toFixed(1)}`
      };
    }
  },
  {
    id: 'blood_transfusion',
    name: 'Volume de Transfusion Sanguine',
    category: 'Hématologie',
    fields: [
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
      { label: 'Hb Actuelle', name: 'hb_act', type: 'number', unit: 'g/dL' },
      { label: 'Hb Cible', name: 'hb_target', type: 'number', unit: 'g/dL' },
    ],
    calculate: (values) => {
      const w = parseFloat(values.weight);
      const hba = parseFloat(values.hb_act);
      const hbt = parseFloat(values.hb_target);
      if (!w || !hba || !hbt) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Poids * (Hb Cible - Hb Actuelle) * 3' };
      
      const volume = w * (hbt - hba) * 3;
      return {
        result: Math.round(volume) + ' mL',
        interpretation: 'Volume estimé de Concentré de Globules Rouges (CGR) à transfuser.',
        formula: `${w} * (${hbt} - ${hba}) * 3 = ${Math.round(volume)} mL`
      };
    }
  },
  {
    id: 'curb65',
    name: 'Score CURB-65',
    category: 'Urgences',
    fields: [
      { label: 'Confusion', name: 'c', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Urée > 7 mmol/L (19 mg/dL)', name: 'u', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Fréq. Resp. ≥ 30/min', name: 'r', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'PAS < 90 ou PAD ≤ 60', name: 'b', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Âge ≥ 65 ans', name: 'a', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
      let interp = '';
      if (score <= 1) interp = 'Risque faible (Traitement ambulatoire)';
      else if (score === 2) interp = 'Risque modéré (Hospitalisation à envisager)';
      else interp = 'Risque élevé (Hospitalisation urgente)';
      return {
        result: score.toString(),
        interpretation: interp,
        formula: `Total des points = ${score}`
      };
    }
  },
  {
    id: 'wells_dvt',
    name: 'Score de Wells (TVP)',
    category: 'Urgences',
    fields: [
      { label: 'Cancer actif', name: 'c', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Paralysie ou plâtre', name: 'p', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Alitement > 3j ou Chirurgie < 12 sem', name: 's', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Douleur trajet veineux', name: 't', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Oedème de tout le membre', name: 'sw', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Mollet > 3cm vs autre', name: 'cs', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Oedème prenant le godet', name: 'pe', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Veines collatérales', name: 'cv', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Diagnostic alternatif probable', name: 'ad', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: -2 }] },
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
      let interp = '';
      if (score >= 3) interp = 'Probabilité élevée';
      else if (score >= 1) interp = 'Probabilité modérée';
      else interp = 'Probabilité faible';
      return {
        result: score.toString(),
        interpretation: interp,
        formula: `Total des points = ${score}`
      };
    }
  },
  {
    id: 'shock_index',
    name: 'Index de Choc',
    category: 'Urgences',
    fields: [
      { label: 'Fréquence Cardiaque', name: 'hr', type: 'number', unit: 'bpm' },
      { label: 'Systolique (PAS)', name: 'pas', type: 'number', unit: 'mmHg' },
    ],
    calculate: (values) => {
      const hr = parseFloat(values.hr);
      const pas = parseFloat(values.pas);
      if (!hr || !pas) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'FC / PAS' };
      const si = hr / pas;
      return {
        result: si.toFixed(2),
        interpretation: si > 0.9 ? 'Signe de choc occulte (Risque élevé)' : 'Normal (0.5 - 0.7)',
        formula: `${hr} / ${pas} = ${si.toFixed(2)}`
      };
    }
  },
  {
    id: 'wells_pe',
    name: 'Score de Wells (EP)',
    category: 'Urgences',
    fields: [
      { label: 'Signes cliniques de TVP', name: 'dvt', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 3 }] },
      { label: 'Diagnostic alternatif moins probable', name: 'alt', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 3 }] },
      { label: 'FC > 100 bpm', name: 'hr', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1.5 }] },
      { label: 'Immobilisation > 3j ou Chirurgie < 4 sem', name: 'imm', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1.5 }] },
      { label: 'Antécédent TVP/EP', name: 'prev', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1.5 }] },
      { label: 'Hémoptysie', name: 'hem', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Cancer', name: 'can', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
      let interp = '';
      if (score > 6) interp = 'Probabilité élevée';
      else if (score >= 2) interp = 'Probabilité modérée';
      else interp = 'Probabilité faible';
      return {
        result: score.toString(),
        interpretation: interp,
        formula: `Total des points = ${score}`
      };
    }
  },
  {
    id: 'sirs',
    name: 'Critères du SIRS',
    category: 'Urgences',
    fields: [
      { label: 'Température < 36°C ou > 38°C', name: 't', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'FC > 90 bpm', name: 'hr', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'FR > 20/min ou PaCO₂ < 32 mmHg', name: 'rr', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
      { label: 'Leucocytes < 4k ou > 12k /mm³', name: 'wbc', type: 'select', options: [{ label: 'Non', value: 0 }, { label: 'Oui', value: 1 }] },
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
      let interp = '';
      if (score >= 2) interp = 'SIRS Positif (Risque de sepsis)';
      else interp = 'SIRS Négatif';
      return {
        result: score.toString() + '/4',
        interpretation: interp,
        formula: `Total des critères = ${score}`
      };
    }
  },
  {
    id: 'edd',
    name: 'Date Prévue d\'Accouchement (EDD)',
    category: 'Gynéco-Obstétrique',
    fields: [
      { label: 'Date des dernières règles (DDR)', name: 'lmp', type: 'number', placeholder: 'Format: AAAAMMJJ (ex: 20231025)' },
    ],
    calculate: (values) => {
      const lmpStr = values.lmp?.toString();
      if (!lmpStr || lmpStr.length !== 8) return { result: '-', interpretation: 'Veuillez entrer une date au format AAAAMMJJ', formula: 'Règle de Naegele: DDR + 7 jours - 3 mois + 1 an' };
      
      const year = parseInt(lmpStr.substring(0, 4));
      const month = parseInt(lmpStr.substring(4, 6)) - 1;
      const day = parseInt(lmpStr.substring(6, 8));
      
      const lmpDate = new Date(year, month, day);
      const eddDate = new Date(lmpDate);
      eddDate.setDate(eddDate.getDate() + 7);
      eddDate.setMonth(eddDate.getMonth() - 3);
      eddDate.setFullYear(eddDate.getFullYear() + 1);

      return {
        result: eddDate.toLocaleDateString('fr-DZ'),
        interpretation: 'Date estimée de l\'accouchement selon la règle de Naegele.',
        formula: `DDR(${lmpDate.toLocaleDateString()}) + 7j - 3m + 1an = ${eddDate.toLocaleDateString()}`
      };
    }
  },
  {
    id: 'peds_weight',
    name: 'Estimation du Poids (Pédiatrie)',
    category: 'Pédiatrie',
    fields: [
      { label: 'Âge', name: 'age', type: 'number', unit: 'ans' },
    ],
    calculate: (values) => {
      const age = parseFloat(values.age);
      if (!age) return { result: '-', interpretation: 'Veuillez entrer l\'âge', formula: '(Âge + 4) * 2' };
      const weight = (age + 4) * 2;
      return {
        result: weight.toFixed(1) + ' kg',
        interpretation: 'Estimation rapide du poids pour un enfant de 1 à 10 ans.',
        formula: `(${age} + 4) * 2 = ${weight}`
      };
    }
  },
  {
    id: 'gcs',
    name: 'Score de Glasgow (GCS)',
    category: 'Neurologie',
    fields: [
      { 
        label: 'Ouverture des yeux', 
        name: 'eyes', 
        type: 'select', 
        options: [
          { label: 'Spontanée (4)', value: 4 },
          { label: 'Au bruit (3)', value: 3 },
          { label: 'À la douleur (2)', value: 2 },
          { label: 'Nulle (1)', value: 1 },
        ] 
      },
      { 
        label: 'Réponse verbale', 
        name: 'verbal', 
        type: 'select', 
        options: [
          { label: 'Orientée (5)', value: 5 },
          { label: 'Confuse (4)', value: 4 },
          { label: 'Inappropriée (3)', value: 3 },
          { label: 'Incompréhensible (2)', value: 2 },
          { label: 'Nulle (1)', value: 1 },
        ] 
      },
      { 
        label: 'Réponse motrice', 
        name: 'motor', 
        type: 'select', 
        options: [
          { label: 'Obéit (6)', value: 6 },
          { label: 'Localise (5)', value: 5 },
          { label: 'Retrait (4)', value: 4 },
          { label: 'Flexion (3)', value: 3 },
          { label: 'Extension (2)', value: 2 },
          { label: 'Nulle (1)', value: 1 },
        ] 
      },
    ],
    calculate: (values) => {
      const e = parseInt(values.eyes) || 0;
      const v = parseInt(values.verbal) || 0;
      const m = parseInt(values.motor) || 0;
      if (!e || !v || !m) return { result: '-', interpretation: 'Veuillez sélectionner toutes les options', formula: 'E + V + M' };
      const total = e + v + m;
      let interp = '';
      if (total >= 13) interp = 'Traumatisme léger';
      else if (total >= 9) interp = 'Traumatisme modéré';
      else interp = 'Traumatisme sévère (Coma)';
      return {
        result: total.toString() + '/15',
        interpretation: interp,
        formula: `${e} + ${v} + ${m} = ${total}`
      };
    }
  },
  {
    id: 'corrected_ca',
    name: 'Calcium Corrigé',
    category: 'Biochimie',
    fields: [
      { label: 'Calcium Sérique', name: 'ca', type: 'number', unit: 'mg/dL' },
      { label: 'Albumine', name: 'alb', type: 'number', unit: 'g/dL' },
    ],
    calculate: (values) => {
      const ca = parseFloat(values.ca);
      const alb = parseFloat(values.alb);
      if (!ca || !alb) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Ca + 0.8 * (4 - Alb)' };
      const corrected = ca + 0.8 * (4 - alb);
      return {
        result: corrected.toFixed(1) + ' mg/dL',
        interpretation: (corrected >= 8.5 && corrected <= 10.5) ? 'Normal' : (corrected < 8.5 ? 'Hypocalcémie' : 'Hypercalcémie'),
        formula: `${ca} + 0.8 * (4 - ${alb}) = ${corrected.toFixed(1)}`
      };
    }
  },
  {
    id: 'apgar',
    name: 'Score d\'APGAR',
    category: 'Pédiatrie',
    fields: [
      { label: 'Apparence (Coloration)', name: 'a', type: 'select', options: [{label: 'Bleu/Pâle (0)', value: 0}, {label: 'Corps rose, extr. bleues (1)', value: 1}, {label: 'Entièrement rose (2)', value: 2}] },
      { label: 'Pouls (Fréquence cardiaque)', name: 'p', type: 'select', options: [{label: 'Absent (0)', value: 0}, {label: '< 100 bpm (1)', value: 1}, {label: '> 100 bpm (2)', value: 2}] },
      { label: 'Grimace (Réactivité)', name: 'g', type: 'select', options: [{label: 'Nulle (0)', value: 0}, {label: 'Grimace (1)', value: 1}, {label: 'Cri/Toux/Éternuement (2)', value: 2}] },
      { label: 'Activité (Tonus)', name: 'ac', type: 'select', options: [{label: 'Flaccide (0)', value: 0}, {label: 'Légère flexion (1)', value: 1}, {label: 'Mouvements actifs (2)', value: 2}] },
      { label: 'Respiration', name: 'r', type: 'select', options: [{label: 'Absente (0)', value: 0}, {label: 'Lente/Irrégulière (1)', value: 1}, {label: 'Cri vigoureux (2)', value: 2}] },
    ],
    calculate: (values) => {
      const score = (parseInt(values.a) || 0) + (parseInt(values.p) || 0) + (parseInt(values.g) || 0) + (parseInt(values.ac) || 0) + (parseInt(values.r) || 0);
      let interp = '';
      if (score >= 7) interp = 'Normal';
      else if (score >= 4) interp = 'Détresse modérée';
      else interp = 'Détresse sévère';
      return {
        result: score.toString() + '/10',
        interpretation: interp,
        formula: `A+P+G+A+R = ${score}`
      };
    }
  },
  {
    id: 'das28',
    name: 'Score DAS28 (Polyarthrite Rhumatoïde)',
    category: 'Rhumatologie',
    fields: [
      { label: 'Articulations Douloureuses (0-28)', name: 'tj', type: 'number' },
      { label: 'Articulations Gonflées (0-28)', name: 'sj', type: 'number' },
      { label: 'VS (Vitesse de Sédimentation)', name: 'esr', type: 'number', unit: 'mm/h' },
      { label: 'Appréciation Globale Patient (0-100)', name: 'gh', type: 'number' },
    ],
    calculate: (values) => {
      const tj = parseFloat(values.tj);
      const sj = parseFloat(values.sj);
      const esr = parseFloat(values.esr);
      const gh = parseFloat(values.gh);
      if (isNaN(tj) || isNaN(sj) || isNaN(esr) || isNaN(gh)) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '0.56*√TJ + 0.28*√SJ + 0.70*ln(VS) + 0.014*GH' };
      
      const das = 0.56 * Math.sqrt(tj) + 0.28 * Math.sqrt(sj) + 0.70 * Math.log(esr) + 0.014 * gh;
      let interp = '';
      if (das < 2.6) interp = 'Rémission';
      else if (das <= 3.2) interp = 'Activité faible';
      else if (das <= 5.1) interp = 'Activité modérée';
      else interp = 'Activité forte';
      
      return {
        result: das.toFixed(2),
        interpretation: interp,
        formula: `0.56*√${tj} + 0.28*√${sj} + 0.70*ln(${esr}) + 0.014*${gh} = ${das.toFixed(2)}`
      };
    }
  },
  {
    id: 'iop_corr',
    name: 'Correction de la PIO (Ophtalmo)',
    category: 'Ophtalmologie',
    fields: [
      { label: 'PIO Mesurée', name: 'iop', type: 'number', unit: 'mmHg' },
      { label: 'Pachymétrie (CCT)', name: 'cct', type: 'number', unit: 'µm' },
    ],
    calculate: (values) => {
      const iop = parseFloat(values.iop);
      const cct = parseFloat(values.cct);
      if (!iop || !cct) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'PIO - (CCT - 545) / 50 * 2.5' };
      
      const corr = iop - (cct - 545) / 50 * 2.5;
      return {
        result: corr.toFixed(1) + ' mmHg',
        interpretation: `PIO corrigée selon l'épaisseur cornéenne.`,
        formula: `${iop} - (${cct} - 545) / 50 * 2.5 = ${corr.toFixed(1)}`
      };
    }
  },
  {
    id: 'bp_class',
    name: 'Classification de la Pression Artérielle',
    category: 'Cardiovasculaire',
    fields: [
      { label: 'Systolique (PAS)', name: 'pas', type: 'number', unit: 'mmHg' },
      { label: 'Diastolique (PAD)', name: 'pad', type: 'number', unit: 'mmHg' },
    ],
    calculate: (values) => {
      const s = parseFloat(values.pas);
      const d = parseFloat(values.pad);
      if (!s || !d) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Classification OMS/JNC8' };
      
      let interp = '';
      if (s < 120 && d < 80) interp = 'Optimale';
      else if (s < 130 && d < 85) interp = 'Normale';
      else if (s < 140 && d < 90) interp = 'Normale haute';
      else if (s < 160 && d < 100) interp = 'HTA Grade 1 (Légère)';
      else if (s < 180 && d < 110) interp = 'HTA Grade 2 (Modérée)';
      else interp = 'HTA Grade 3 (Sévère)';
      
      return {
        result: `${s}/${d} mmHg`,
        interpretation: interp,
        formula: `Classification selon les seuils standards.`
      };
    }
  },
  {
    id: 'gfr_ckdepi',
    name: 'DFG (CKD-EPI 2021)',
    category: 'Rénal',
    fields: [
      { label: 'Âge', name: 'age', type: 'number', unit: 'ans' },
      { label: 'Créatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { label: 'Sexe', name: 'sex', type: 'select', options: [{ label: 'Homme', value: 'male' }, { label: 'Femme', value: 'female' }] },
    ],
    calculate: (values) => {
      const age = parseFloat(values.age);
      const scr = parseFloat(values.creatinine);
      const sex = values.sex;
      if (!age || !scr || !sex) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: '142 * min(SCr/κ, 1)ᵅ * max(SCr/κ, 1)⁻¹·²⁰⁹ * 0.9938ᴬᵍᵉ * [1.012 if Female]' };
      
      const kappa = sex === 'female' ? 0.7 : 0.9;
      const alpha = sex === 'female' ? -0.241 : -0.302;
      const sexMod = sex === 'female' ? 1.012 : 1;
      
      const gfr = 142 * Math.pow(Math.min(scr / kappa, 1), alpha) * Math.pow(Math.max(scr / kappa, 1), -1.200) * Math.pow(0.9938, age) * sexMod;
      
      let interp = '';
      if (gfr >= 90) interp = 'G1: Normal ou élevé';
      else if (gfr >= 60) interp = 'G2: Diminution légère';
      else if (gfr >= 45) interp = 'G3a: Diminution légère à modérée';
      else if (gfr >= 30) interp = 'G3b: Diminution modérée à sévère';
      else if (gfr >= 15) interp = 'G4: Diminution sévère';
      else interp = 'G5: Insuffisance rénale terminale';

      return {
        result: gfr.toFixed(1) + ' mL/min/1.73m²',
        interpretation: interp,
        formula: `Formule CKD-EPI (2021) sans race.`
      };
    }
  },
  {
    id: 'lma_score',
    name: 'Score LMA (Lactate Malate Assay)',
    category: 'Rénal',
    fields: [
      { label: 'Lactate sérique', name: 'lactate', type: 'number', unit: 'mmol/L' },
      { label: 'Malate sérique', name: 'malate', type: 'number', unit: 'µmol/L' },
    ],
    calculate: (values) => {
      const lac = parseFloat(values.lactate);
      const mal = parseFloat(values.malate);
      if (!lac || !mal) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Ratio Lactate / (Malate / 1000)' };
      
      const ratio = lac / (mal / 1000);
      
      return {
        result: ratio.toFixed(2),
        interpretation: 'Ratio Lactate/Malate calculé. Ce ratio est utilisé pour évaluer l\'état d\'oxydoréduction cytosolique.',
        formula: `${lac} / (${mal} / 1000) = ${ratio.toFixed(2)}`
      };
    }
  },
  {
    id: 'corr_na',
    name: 'Sodium Corrigé (Hyperglycémie)',
    category: 'Biochimie',
    fields: [
      { label: 'Sodium Mesuré', name: 'na', type: 'number', unit: 'mEq/L' },
      { label: 'Glucose', name: 'glu', type: 'number', unit: 'mg/dL' },
    ],
    calculate: (values) => {
      const na = parseFloat(values.na);
      const glu = parseFloat(values.glu);
      if (!na || !glu) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'Na + 1.6 * (Glu - 100) / 100' };
      
      const corr = na + 1.6 * (glu - 100) / 100;
      return {
        result: corr.toFixed(1) + ' mEq/L',
        interpretation: 'Sodium corrigé pour l\'effet osmotique du glucose.',
        formula: `${na} + 1.6 * (${glu} - 100) / 100 = ${corr.toFixed(1)}`
      };
    }
  },
  {
    id: 'heart_score',
    name: 'Score HEART (Douleur Thoracique)',
    category: 'Cardiovasculaire',
    fields: [
      { 
        label: 'Histoire (Anamnèse)', 
        name: 'h', 
        type: 'select', 
        options: [
          { label: 'Peu suspecte (0)', value: 0 },
          { label: 'Moyennement suspecte (1)', value: 1 },
          { label: 'Très suspecte (2)', value: 2 },
        ] 
      },
      { 
        label: 'ECG', 
        name: 'e', 
        type: 'select', 
        options: [
          { label: 'Normal (0)', value: 0 },
          { label: 'Troubles repolarisation non spécifiques (1)', value: 1 },
          { label: 'Sous-décalage ST significatif (2)', value: 2 },
        ] 
      },
      { 
        label: 'Âge', 
        name: 'a', 
        type: 'select', 
        options: [
          { label: '< 45 ans (0)', value: 0 },
          { label: '45 - 64 ans (1)', value: 1 },
          { label: '≥ 65 ans (2)', value: 2 },
        ] 
      },
      { 
        label: 'Facteurs de Risque', 
        name: 'r', 
        type: 'select', 
        options: [
          { label: 'Aucun (0)', value: 0 },
          { label: '1 - 2 facteurs (1)', value: 1 },
          { label: '≥ 3 facteurs ou ATCD vasc (2)', value: 2 },
        ] 
      },
      { 
        label: 'Troponine initiale', 
        name: 't', 
        type: 'select', 
        options: [
          { label: '≤ Limite normale (0)', value: 0 },
          { label: '1 - 3 x Limite (1)', value: 1 },
          { label: '> 3 x Limite (2)', value: 2 },
        ] 
      },
    ],
    calculate: (values) => {
      const score = (parseInt(values.h) || 0) + (parseInt(values.e) || 0) + (parseInt(values.a) || 0) + (parseInt(values.r) || 0) + (parseInt(values.t) || 0);
      let interp = '';
      if (score <= 3) interp = 'Risque faible (0.9-1.7% MACE): Sortie possible';
      else if (score <= 6) interp = 'Risque intermédiaire (12-16% MACE): Hospitalisation';
      else interp = 'Risque élevé (50-65% MACE): Intervention invasive';
      
      return {
        result: score.toString(),
        interpretation: interp,
        formula: `Total HEART = ${score}`
      };
    }
  },
  {
    id: 'schwartz',
    name: 'DFG Pédiatrique (Schwartz)',
    category: 'Pédiatrie',
    fields: [
      { label: 'Taille', name: 'height', type: 'number', unit: 'cm' },
      { label: 'Créatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { 
        label: 'Âge / Groupe', 
        name: 'k', 
        type: 'select', 
        options: [
          { label: 'Nouveau-né prématuré (0.33)', value: 0.33 },
          { label: 'Nouveau-né à terme (0.45)', value: 0.45 },
          { label: 'Enfant / Adol. Fille (0.55)', value: 0.55 },
          { label: 'Adol. Garçon (0.70)', value: 0.70 },
        ] 
      },
    ],
    calculate: (values) => {
      const h = parseFloat(values.height);
      const c = parseFloat(values.creatinine);
      const k = parseFloat(values.k);
      if (!h || !c || !k) return { result: '-', interpretation: 'Veuillez remplir tous les champs', formula: 'k * Taille / Créatinine' };
      const gfr = (k * h) / c;
      return {
        result: gfr.toFixed(1) + ' mL/min/1.73m²',
        interpretation: 'Estimation du DFG chez l\'enfant.',
        formula: `${k} * ${h} / ${c} = ${gfr.toFixed(1)}`
      };
    }
  },
  {
    id: 'fluids',
    name: 'Liquides de Maintenance (Holliday-Segar)',
    category: 'Pédiatrie',
    fields: [
      { label: 'Poids', name: 'weight', type: 'number', unit: 'kg' },
    ],
    calculate: (values) => {
      const w = parseFloat(values.weight);
      if (!w) return { result: '-', interpretation: 'Veuillez entrer le poids', formula: '100/50/20 rule' };
      
      let fluids = 0;
      if (w <= 10) fluids = w * 100;
      else if (w <= 20) fluids = 1000 + (w - 10) * 50;
      else fluids = 1500 + (w - 20) * 20;
      
      return {
        result: fluids.toFixed(0) + ' mL/jour',
        interpretation: `Soit environ ${(fluids / 24).toFixed(1)} mL/heure.`,
        formula: w <= 10 ? `${w} * 100` : (w <= 20 ? `1000 + (${w}-10)*50` : `1500 + (${w}-20)*20`)
      };
    }
  },
  {
    id: 'bishop',
    name: 'Score de Bishop',
    category: 'Gynéco-Obstétrique',
    fields: [
      { label: 'Dilatation (cm)', name: 'd', type: 'select', options: [{label: '0 (0)', value: 0}, {label: '1-2 (1)', value: 1}, {label: '3-4 (2)', value: 2}, {label: '≥5 (3)', value: 3}] },
      { label: 'Effacement (%)', name: 'e', type: 'select', options: [{label: '0-30 (0)', value: 0}, {label: '40-50 (1)', value: 1}, {label: '60-70 (2)', value: 2}, {label: '≥80 (3)', value: 3}] },
      { label: 'Station', name: 's', type: 'select', options: [{label: '-3 (0)', value: 0}, {label: '-2 (1)', value: 1}, {label: '-1, 0 (2)', value: 2}, {label: '+1, +2 (3)', value: 3}] },
      { label: 'Consistance', name: 'c', type: 'select', options: [{label: 'Ferme (0)', value: 0}, {label: 'Moyenne (1)', value: 1}, {label: 'Molle (2)', value: 2}] },
      { label: 'Position', name: 'p', type: 'select', options: [{label: 'Postérieure (0)', value: 0}, {label: 'Intermédiaire (1)', value: 1}, {label: 'Antérieure (2)', value: 2}] },
    ],
    calculate: (values) => {
      const score = (parseInt(values.d) || 0) + (parseInt(values.e) || 0) + (parseInt(values.s) || 0) + (parseInt(values.c) || 0) + (parseInt(values.p) || 0);
      let interp = '';
      if (score >= 8) interp = 'Col favorable (Probabilité élevée d\'accouchement vaginal)';
      else if (score <= 5) interp = 'Col défavorable';
      else interp = 'Score intermédiaire';
      return {
        result: score.toString() + '/13',
        interpretation: interp,
        formula: `Total Bishop = ${score}`
      };
    }
  }
];

export default function MedicalCalculator() {
  const [selectedCalc, setSelectedCalc] = useState<CalculatorDefinition | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCalculators = CALCULATORS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const result = selectedCalc ? selectedCalc.calculate(values) : null;

  return (
    <div className="flex flex-col h-full bg-med-bg text-med-text font-sans overflow-hidden transition-colors duration-300">
      <div className="p-4 sm:p-6 border-b border-med-border bg-med-bg sticky top-0 z-10 shrink-0 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[16px] sm:text-[18px] font-bold text-med-text">Calculateurs Médicaux</h1>
            <p className="text-med-text-muted text-[10px] sm:text-[12px]">Outils de calcul et scores cliniques.</p>
          </div>
          <Calculator className="text-med-accent" size={24} />
        </div>
        
        {!selectedCalc && (
          <div className="relative">
            <input 
              type="text"
              placeholder="Rechercher un calculateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-med-card border border-med-border rounded-xl py-2 px-4 text-sm text-med-text focus:outline-none focus:border-med-accent/50 transition-colors duration-300"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
        <AnimatePresence mode="wait">
          {!selectedCalc ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {filteredCalculators.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => {
                    setSelectedCalc(calc);
                    setValues({});
                  }}
                  className="w-full bg-med-card border border-med-border rounded-2xl p-4 flex items-center justify-between hover:border-med-accent/30 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-[10px] text-med-text-muted uppercase font-bold tracking-wider mb-1">{calc.category}</p>
                    <h3 className="text-sm font-bold text-med-text group-hover:text-med-accent transition-colors">{calc.name}</h3>
                  </div>
                  <ChevronRight size={18} className="text-med-border group-hover:text-med-accent transition-colors" />
                </button>
              ))}

              <div className="pt-4 border-t border-med-border mt-6">
                <div className="bg-med-accent/5 border border-dashed border-med-accent/20 rounded-2xl p-6 text-center">
                  <Calculator className="mx-auto text-med-accent/40 mb-3" size={32} />
                  <h3 className="text-sm font-bold text-med-text mb-2">Besoin d'un autre calculateur ?</h3>
                  <p className="text-xs text-med-text-muted mb-4 leading-relaxed">
                    Si vous ne trouvez pas le score ou la formule que vous cherchez, demandez à l'Assistant IA de le construire pour vous.
                  </p>
                  <button 
                    onClick={() => {
                      // We need a way to navigate to assistant with calculator mode
                      // For now just navigate to assistant
                      window.dispatchEvent(new CustomEvent('navigate-to-assistant-calc'));
                    }}
                    className="bg-med-accent text-med-bg px-6 py-2 rounded-xl text-xs font-bold hover:bg-med-accent/90 transition-all"
                  >
                    Demander à l'IA
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="calc"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setSelectedCalc(null)}
                className="flex items-center gap-2 text-med-text-muted hover:text-med-accent transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} /> Retour à la liste
              </button>

              <div className="bg-med-card border border-med-border rounded-3xl p-6 space-y-6 transition-colors duration-300">
                <div className="border-b border-med-border pb-4">
                  <p className="text-[10px] text-med-text-muted uppercase font-bold tracking-wider mb-1">{selectedCalc.category}</p>
                  <h2 className="text-lg font-bold text-med-text">{selectedCalc.name}</h2>
                </div>

                <div className="space-y-4">
                  {selectedCalc.fields.map((field, index) => (
                    <motion.div 
                      key={field.name} 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <label className="text-xs font-bold text-med-text-muted uppercase tracking-wide">{field.label}</label>
                      <div className="relative">
                        {field.type === 'number' ? (
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={values[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full bg-med-bg border border-med-border rounded-xl py-3 px-4 text-sm text-med-text focus:outline-none focus:border-med-accent/50 transition-colors"
                            />
                            {field.unit && (
                              <span className="absolute right-4 text-xs font-bold text-med-border">{field.unit}</span>
                            )}
                          </div>
                        ) : (
                          <select
                            value={values[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full bg-med-bg border border-med-border rounded-xl py-3 px-4 text-sm text-med-text focus:outline-none focus:border-med-accent/50 appearance-none transition-colors"
                          >
                            <option value="">Sélectionner...</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {result && result.result !== '-' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-med-accent/10 border border-med-accent/20 rounded-2xl p-6 space-y-4"
                  >
                    <div className="text-center">
                      <p className="text-[10px] text-med-accent uppercase font-bold tracking-widest mb-1">Résultat</p>
                      <h3 className="text-3xl font-black text-med-accent">{result.result}</h3>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-med-bg/50 rounded-xl p-3">
                      <Info size={16} className="text-med-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-med-text mb-1">Interprétation</p>
                        <p className="text-xs text-med-text-muted leading-relaxed">{result.interpretation}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-med-accent/10">
                      <p className="text-[9px] text-med-text-muted uppercase font-bold mb-1">Formule utilisée</p>
                      <code className="text-[10px] text-med-accent/70 font-mono break-all">{result.formula}</code>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
