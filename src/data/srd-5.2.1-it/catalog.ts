import {
  RULESET_ID,
  type AbilityKey,
  type AbilityScore,
  type Background,
  type BuilderStep,
  type CharacterClass,
  type RulesSourceReference,
  type Species,
} from '../../types/character'

export const SRD_ATTRIBUTION = 'Quest’opera include materiale tratto dal System Reference Document 5.2.1 ("SRD 5.2.1") di Wizards of the Coast LLC, disponibile all’indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 è concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all’indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.'
export const UNOFFICIAL_NOTICE = 'D&D Character Forge è un progetto non ufficiale e non è approvato né sponsorizzato da Wizards of the Coast.'

const source = (section: string, page: number): RulesSourceReference => ({
  sourceId: RULESET_ID,
  sourceTitle: 'SRD 5.2.1 Italiano',
  sourceSection: section,
  sourcePage: page,
  license: 'CC-BY-4.0',
  ruleset: RULESET_ID,
  isSrdContent: true,
  requiresOfficialBook: false,
})

const skills = {
  barbarian: ['Addestrare Animali', 'Atletica', 'Intimidire', 'Natura', 'Percezione', 'Sopravvivenza'],
  bard: ['Acrobazia', 'Addestrare Animali', 'Arcano', 'Atletica', 'Furtività', 'Indagare', 'Inganno', 'Intimidire', 'Intrattenere', 'Intuizione', 'Medicina', 'Natura', 'Percezione', 'Persuasione', 'Rapidità di Mano', 'Religione', 'Sopravvivenza', 'Storia'],
  cleric: ['Intuizione', 'Medicina', 'Persuasione', 'Religione', 'Storia'],
  druid: ['Addestrare Animali', 'Arcano', 'Intuizione', 'Medicina', 'Natura', 'Percezione', 'Religione', 'Sopravvivenza'],
  fighter: ['Acrobazia', 'Addestrare Animali', 'Atletica', 'Intimidire', 'Intuizione', 'Percezione', 'Persuasione', 'Sopravvivenza', 'Storia'],
  rogue: ['Acrobazia', 'Atletica', 'Furtività', 'Indagare', 'Inganno', 'Intimidire', 'Intuizione', 'Percezione', 'Persuasione', 'Rapidità di Mano'],
  wizard: ['Arcano', 'Indagare', 'Intuizione', 'Medicina', 'Natura', 'Religione', 'Storia'],
  monk: ['Acrobazia', 'Atletica', 'Furtività', 'Intuizione', 'Religione', 'Storia'],
  paladin: ['Atletica', 'Intimidire', 'Intuizione', 'Medicina', 'Persuasione', 'Religione'],
  ranger: ['Addestrare Animali', 'Atletica', 'Furtività', 'Indagare', 'Intuizione', 'Natura', 'Percezione', 'Sopravvivenza'],
  sorcerer: ['Arcano', 'Inganno', 'Intimidire', 'Intuizione', 'Persuasione', 'Religione'],
  warlock: ['Arcano', 'Indagare', 'Inganno', 'Intimidire', 'Natura', 'Religione', 'Storia'],
}

const masteryWeapons = [
  'Alabarda', 'Arco corto', 'Arco lungo', 'Ascia', 'Ascia bipenne', 'Ascia da battaglia',
  'Balestra a mano', 'Balestra leggera', 'Balestra pesante', 'Bastone ferrato', 'Cerbottana',
  'Dardo', 'Falcetto', 'Falcione', 'Fionda', 'Frusta', 'Giavellotto', 'Lancia',
  'Lancia da cavaliere', 'Maglio', 'Martello da guerra', 'Martello leggero', 'Mazza',
  'Mazza chiodata', 'Mazzafrusto', 'Moschetto', 'Picca', 'Piccone da guerra', 'Pistola',
  'Pugnale', 'Randello', 'Randello pesante', 'Scimitarra', 'Spada corta', 'Spada lunga',
  'Spadone', 'Stocco', 'Tridente',
].map((label) => ({ id: `weapon-${label.toLocaleLowerCase('it').replaceAll(' ', '-')}`, label }))

const fightingStyles = ['Combattere con armi possenti', 'Combattere con due armi', 'Difesa', 'Tiro']
  .map((label) => ({ id: `style-${label.toLocaleLowerCase('it').replaceAll(' ', '-')}`, label }))

const musicalInstruments = ['Cornamusa', 'Tamburo', 'Dulcimer', 'Flauto', 'Corno', 'Liuto', 'Lira', 'Flauto di pan', 'Ciaramella', 'Viola']
  .map((label) => ({ id: `instrument-${label.toLocaleLowerCase('it').replaceAll(' ', '-')}`, label }))

const monkTools = [
  'Scorte da alchimista', 'Scorte da birraio', 'Scorte da calligrafo', 'Strumenti da calzolaio',
  'Strumenti da cartografo', 'Strumenti da conciatore', 'Strumenti da fabbro', 'Strumenti da falegname',
  'Strumenti da gioielliere', 'Strumenti da intagliatore', 'Strumenti da inventore',
  'Strumenti da muratore', 'Strumenti da pittore', 'Strumenti da soffiatore',
  'Strumenti da tessitore', 'Strumenti da vasaio', 'Utensili da cuoco',
  ...musicalInstruments.map((item) => item.label),
].map((label) => ({ id: `tool-${label.toLocaleLowerCase('it').replaceAll(' ', '-')}`, label }))

const rogueMasteryWeapons = masteryWeapons.filter((item) => [
  'Ascia', 'Bastone ferrato', 'Falcetto', 'Giavellotto', 'Lancia', 'Martello leggero', 'Mazza',
  'Pugnale', 'Randello pesante', 'Randello', 'Arco corto', 'Balestra leggera', 'Dardo', 'Fionda',
  'Frusta', 'Scimitarra', 'Spada corta', 'Stocco', 'Balestra a mano',
].includes(item.label))

type ClassInput = Omit<CharacterClass, 'source' | 'levelOneHitPoints' | 'hasLevelOneSpells'>
  & { page: number }

const makeClass = (entry: ClassInput): CharacterClass => ({
  ...entry,
  source: source(`Classi: ${entry.nameIt}`, entry.page),
  levelOneHitPoints: `${entry.hitDie} + modificatore di Costituzione`,
  hasLevelOneSpells: entry.spellcasting !== null,
})

export const classOptions: CharacterClass[] = [
  makeClass({
    id: 'barbarian', nameIt: 'Barbaro', page: 32, icon: '◆', role: 'Combattente resistente',
    shortDescription: 'Un combattente impetuoso che assorbe i colpi e domina la prima linea.',
    primaryAbility: 'strength', primaryAbilities: ['strength'], complexity: 'facile',
    styles: ['mischia'], filters: ['facile', 'marziali', 'mischia'], hitDie: 12,
    armorProficiencies: ['Armature leggere', 'Armature medie', 'Scudi'],
    weaponProficiencies: ['Armi semplici', 'Armi da guerra'], toolProficiencies: [],
    savingThrows: ['strength', 'constitution'], skillChoices: skills.barbarian, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Ascia bipenne, 4 asce, dotazione da esploratore e 15 mo' }],
    goldAlternative: 75, spellcasting: null, weaponMasteryCount: 2,
    levelOneFeatures: [
      { id: 'rage', nameIt: 'Ira', summary: 'Ira attivabile come azione bonus, con usi e recupero indicati dalla classe.', level: 1 },
      { id: 'unarmored-defense', nameIt: 'Difesa senza armatura', summary: 'CA basata su Destrezza e Costituzione quando non indossa armatura.', level: 1 },
      { id: 'weapon-mastery', nameIt: 'Padronanza d’armi', summary: 'Sceglie due armi di cui usare le proprietà di padronanza.', level: 1 },
    ],
    requiredChoices: [{ id: 'weapon-mastery', label: 'Padronanze nelle armi', count: 2, options: masteryWeapons }],
    howToPlay: 'Entra in mischia, attiva l’Ira nei combattimenti importanti e proteggi gli alleati più fragili.',
    strengths: ['Molti punti ferita', 'Danni affidabili in mischia'], considerations: ['Usi limitati dell’Ira', 'Poca magia'],
    suggestions: ['Tieni alta Forza e considera Costituzione per resistere.'],
  }),
  makeClass({
    id: 'bard', nameIt: 'Bardo', page: 35, icon: '♪', role: 'Supporto versatile',
    shortDescription: 'Un artista arcano che sostiene il gruppo con magia, abilità e ispirazione.',
    primaryAbility: 'charisma', primaryAbilities: ['charisma'], complexity: 'media',
    styles: ['magia', 'supporto', 'utilità'], filters: ['incantatori', 'supporto'], hitDie: 8,
    armorProficiencies: ['Armature leggere'], weaponProficiencies: ['Armi semplici'],
    toolProficiencies: ['Tre strumenti musicali a scelta'], savingThrows: ['dexterity', 'charisma'],
    skillChoices: skills.bard, skillChoiceCount: 3,
    startingEquipment: [{ id: 'a', label: 'Armatura di cuoio, 2 pugnali, uno strumento musicale, dotazione da intrattenitore e 19 mo' }],
    goldAlternative: 90, weaponMasteryCount: 0,
    spellcasting: { ability: 'charisma', cantrips: 2, preparedSpells: 4, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '2 trucchetti, 4 incantesimi preparati e 2 slot di 1º livello.', level: 1 },
      { id: 'bardic-inspiration', nameIt: 'Ispirazione bardica', summary: 'Conferisce un dado di Ispirazione bardica usando un’azione bonus.', level: 1 },
    ],
    requiredChoices: [{ id: 'musical-instruments', label: 'Competenze negli strumenti musicali', count: 3, options: musicalInstruments }], howToPlay: 'Alterna supporto magico, competenze e soluzioni sociali.',
    strengths: ['Grande versatilità', 'Supporto efficace'], considerations: ['Molte opzioni da scegliere'],
    suggestions: ['Scegli abilità che completino quelle degli altri personaggi.'],
  }),
  makeClass({
    id: 'cleric', nameIt: 'Chierico', page: 41, icon: '✦', role: 'Supporto e difesa',
    shortDescription: 'Un incantatore divino capace di proteggere, curare e affrontare il pericolo.',
    primaryAbility: 'wisdom', primaryAbilities: ['wisdom'], complexity: 'media',
    styles: ['magia', 'supporto', 'mischia'], filters: ['incantatori', 'supporto', 'mischia'], hitDie: 8,
    armorProficiencies: ['Armature leggere', 'Armature medie', 'Scudi'], weaponProficiencies: ['Armi semplici'],
    toolProficiencies: [], savingThrows: ['wisdom', 'charisma'], skillChoices: skills.cleric, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Giaco di maglia, scudo, mazza, simbolo sacro, dotazione da sacerdote e 7 mo' }],
    goldAlternative: 110, weaponMasteryCount: 0,
    spellcasting: { ability: 'wisdom', cantrips: 3, preparedSpells: 4, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '3 trucchetti, 4 incantesimi preparati e 2 slot di 1º livello.', level: 1 },
      { id: 'divine-order', nameIt: 'Ordine divino', summary: 'Sceglie tra Protettore e Taumaturgo.', level: 1 },
    ],
    requiredChoices: [{ id: 'divine-order', label: 'Ordine divino', count: 1, options: [
      { id: 'protector', label: 'Protettore', summary: 'Competenza nelle armi da guerra e nelle armature pesanti.' },
      { id: 'thaumaturge', label: 'Taumaturgo', summary: 'Un trucchetto da chierico extra e bonus ad Arcano o Religione pari a Saggezza (minimo +1).' },
    ] }],
    howToPlay: 'Prepara ogni giorno strumenti divini per sostenere il gruppo e affrontare minacce diverse.',
    strengths: ['Difesa e supporto', 'Incantesimi preparabili'], considerations: ['Scelta quotidiana degli incantesimi'],
    suggestions: ['Protettore favorisce la prima linea; Taumaturgo amplia l’uso della magia.'],
  }),
  makeClass({
    id: 'druid', nameIt: 'Druido', page: 46, icon: '❧', role: 'Incantatore della natura',
    shortDescription: 'Un custode della natura che combina magia, conoscenza e adattabilità.',
    primaryAbility: 'wisdom', primaryAbilities: ['wisdom'], complexity: 'avanzata',
    styles: ['magia', 'supporto', 'utilità'], filters: ['incantatori', 'supporto'], hitDie: 8,
    armorProficiencies: ['Armature leggere', 'Scudi'], weaponProficiencies: ['Armi semplici'],
    toolProficiencies: ['Borsa da erborista'], savingThrows: ['intelligence', 'wisdom'],
    skillChoices: skills.druid, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Armatura di cuoio, scudo, falcetto, focus druidico, dotazione da esploratore, borsa da erborista e 9 mo' }],
    goldAlternative: 50, weaponMasteryCount: 0,
    spellcasting: { ability: 'wisdom', cantrips: 2, preparedSpells: 4, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'druidic', nameIt: 'Druidico', summary: 'Conosce il Druidico e considera Parlare con gli animali sempre preparato.', level: 1 },
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '2 trucchetti, 4 incantesimi preparati e 2 slot di 1º livello.', level: 1 },
      { id: 'primal-order', nameIt: 'Ordine primordiale', summary: 'Sceglie tra Mago e Custode.', level: 1 },
    ],
    requiredChoices: [{ id: 'primal-order', label: 'Ordine primordiale', count: 1, options: [
      { id: 'magician', label: 'Mago', summary: 'Un trucchetto da druido extra e bonus ad Arcano o Natura pari a Saggezza (minimo +1).' },
      { id: 'warden', label: 'Custode', summary: 'Competenza nelle armi da guerra e nelle armature medie.' },
    ] }],
    howToPlay: 'Adatta gli incantesimi alla giornata e usa conoscenze naturali per esplorazione e supporto.',
    strengths: ['Magia flessibile', 'Utilità fuori dal combattimento'], considerations: ['Preparazione e molte opzioni'],
    suggestions: ['Mago privilegia la magia; Custode aggiunge addestramento marziale e armature medie.'],
  }),
  makeClass({
    id: 'fighter', nameIt: 'Guerriero', page: 53, icon: '⚔', role: 'Combattente versatile',
    shortDescription: 'Un maestro delle armi che adatta tecnica e attrezzatura a ogni scontro.',
    primaryAbility: 'strength', primaryAbilities: ['strength', 'dexterity'], complexity: 'facile',
    styles: ['mischia', 'distanza'], filters: ['facile', 'marziali', 'mischia', 'distanza'], hitDie: 10,
    armorProficiencies: ['Armature leggere', 'Armature medie', 'Armature pesanti', 'Scudi'],
    weaponProficiencies: ['Armi semplici', 'Armi da guerra'], toolProficiencies: [],
    savingThrows: ['strength', 'constitution'], skillChoices: skills.fighter, skillChoiceCount: 2,
    startingEquipment: [
      { id: 'a', label: 'Cotta di maglia, spadone, mazzafrusto, 8 giavellotti, dotazione da avventuriero e 4 mo' },
      { id: 'b', label: 'Cuoio borchiato, scimitarra, spada corta, arco lungo, 20 frecce, faretra, dotazione da avventuriero e 11 mo' },
    ],
    goldAlternative: 155, spellcasting: null, weaponMasteryCount: 3,
    levelOneFeatures: [
      { id: 'fighting-style', nameIt: 'Stile di combattimento', summary: 'Ottiene un talento Stile di combattimento.', level: 1 },
      { id: 'second-wind', nameIt: 'Recuperare energie', summary: 'Recupera punti ferita con un’azione bonus.', level: 1 },
      { id: 'weapon-mastery', nameIt: 'Padronanza d’armi', summary: 'Sceglie tre armi di cui usare le proprietà di padronanza.', level: 1 },
    ],
    requiredChoices: [
      { id: 'primary-ability', label: 'Caratteristica principale', count: 1, options: [{ id: 'strength', label: 'Forza' }, { id: 'dexterity', label: 'Destrezza' }] },
      { id: 'fighting-style', label: 'Stile di combattimento', count: 1, options: fightingStyles },
      { id: 'weapon-mastery', label: 'Padronanze nelle armi', count: 3, options: masteryWeapons },
    ],
    howToPlay: 'Scegli uno stile, usa la padronanza adatta e resta efficace turno dopo turno.',
    strengths: ['Semplice da iniziare', 'Molte armi e armature'], considerations: ['Le scelte di arma definiscono il ruolo'],
    suggestions: ['Forza favorisce mischia e armature pesanti; Destrezza favorisce distanza e agilità.'],
  }),
  makeClass({
    id: 'rogue', nameIt: 'Ladro', page: 55, icon: '◒', role: 'Esperto furtivo',
    shortDescription: 'Un esperto agile che risolve problemi con precisione, mobilità e talento.',
    primaryAbility: 'dexterity', primaryAbilities: ['dexterity'], complexity: 'media',
    styles: ['furtività', 'distanza', 'utilità'], filters: ['marziali', 'furtività', 'distanza'], hitDie: 8,
    armorProficiencies: ['Armature leggere'], weaponProficiencies: ['Armi semplici', 'Armi da guerra con proprietà Accurata o Leggera'],
    toolProficiencies: ['Arnesi da scasso'], savingThrows: ['dexterity', 'intelligence'],
    skillChoices: skills.rogue, skillChoiceCount: 4,
    startingEquipment: [{ id: 'a', label: 'Armatura di cuoio, 2 pugnali, spada corta, arco corto, 20 frecce, faretra, arnesi da scasso, dotazione da scassinatore e 8 mo' }],
    goldAlternative: 100, spellcasting: null, weaponMasteryCount: 2,
    levelOneFeatures: [
      { id: 'expertise', nameIt: 'Maestria', summary: 'Sceglie due competenze nelle abilità in cui raddoppiare il bonus di competenza.', level: 1 },
      { id: 'sneak-attack', nameIt: 'Attacco furtivo', summary: 'Una volta per turno può infliggere danni extra nelle condizioni previste.', level: 1 },
      { id: 'thieves-cant', nameIt: 'Gergo ladresco', summary: 'Conosce il Gergo ladresco e un linguaggio aggiuntivo.', level: 1 },
      { id: 'weapon-mastery', nameIt: 'Padronanza d’armi', summary: 'Sceglie due armi di cui usare le proprietà di padronanza.', level: 1 },
    ],
    requiredChoices: [
      { id: 'expertise', label: 'Maestria nelle abilità scelte', count: 2, options: skills.rogue.map((label) => ({ id: label, label })) },
      { id: 'weapon-mastery', label: 'Padronanze nelle armi', count: 2, options: rogueMasteryWeapons },
    ],
    howToPlay: 'Cerca vantaggi di posizione, colpisci con precisione e usa le competenze per aprire nuove strade.',
    strengths: ['Molte competenze', 'Furtività e precisione'], considerations: ['Posizionamento importante'],
    suggestions: ['Coordina i bersagli con gli alleati per sfruttare Attacco furtivo.'],
  }),
  makeClass({
    id: 'wizard', nameIt: 'Mago', page: 59, icon: '✧', role: 'Incantatore versatile',
    shortDescription: 'Uno studioso arcano che prepara una vasta selezione di soluzioni magiche.',
    primaryAbility: 'intelligence', primaryAbilities: ['intelligence'], complexity: 'avanzata',
    styles: ['magia', 'utilità', 'distanza'], filters: ['incantatori', 'distanza'], hitDie: 6,
    armorProficiencies: [], weaponProficiencies: ['Armi semplici'], toolProficiencies: [],
    savingThrows: ['intelligence', 'wisdom'], skillChoices: skills.wizard, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: '2 pugnali, focus arcano (bastone ferrato), veste, libro degli incantesimi, dotazione da studioso e 5 mo' }],
    goldAlternative: 55, weaponMasteryCount: 0,
    spellcasting: { ability: 'intelligence', cantrips: 3, preparedSpells: 4, levelOneSlots: 2, spellbookSpells: 6 },
    levelOneFeatures: [
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '3 trucchetti, 6 incantesimi di 1º livello nel libro, 4 preparati e 2 slot.', level: 1 },
      { id: 'ritual-adept', nameIt: 'Adepto dei rituali', summary: 'Può lanciare come rituali gli incantesimi rituali presenti nel libro.', level: 1 },
      { id: 'arcane-recovery', nameIt: 'Recupero arcano', summary: 'Recupera parte degli slot dopo un riposo breve.', level: 1 },
    ],
    requiredChoices: [], howToPlay: 'Prepara incantesimi adatti alla situazione e resta al sicuro mentre controlli il campo.',
    strengths: ['Ampia scelta magica', 'Rituali e utilità'], considerations: ['Pochi punti ferita', 'Molte regole da gestire'],
    suggestions: ['Bilancia difesa, controllo e utilità nel libro iniziale.'],
  }),
  makeClass({
    id: 'monk', nameIt: 'Monaco', page: 66, icon: '◎', role: 'Combattente mobile',
    shortDescription: 'Un combattente disciplinato che unisce velocità, agilità e colpi senz’armi.',
    primaryAbility: 'dexterity', primaryAbilities: ['dexterity', 'wisdom'], complexity: 'media',
    styles: ['mischia', 'utilità'], filters: ['marziali', 'mischia'], hitDie: 8,
    armorProficiencies: [], weaponProficiencies: ['Armi semplici', 'Armi da guerra con proprietà Leggera'],
    toolProficiencies: ['Uno strumento da artigiano o musicale a scelta'],
    savingThrows: ['strength', 'dexterity'], skillChoices: skills.monk, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Lancia, 5 pugnali, strumento scelto, dotazione da esploratore e 11 mo' }],
    goldAlternative: 50, spellcasting: null, weaponMasteryCount: 0,
    levelOneFeatures: [
      { id: 'martial-arts', nameIt: 'Arti marziali', summary: 'Usa Destrezza, un dado di Arti marziali e un colpo senz’armi bonus nelle condizioni previste.', level: 1 },
      { id: 'unarmored-defense', nameIt: 'Difesa senza armatura', summary: 'CA basata su Destrezza e Saggezza senza armatura né scudo.', level: 1 },
    ],
    requiredChoices: [{ id: 'monk-tool', label: 'Competenza in uno strumento', count: 1, options: monkTools }], howToPlay: 'Muoviti rapidamente, scegli bene i bersagli e sfrutta gli attacchi aggiuntivi.',
    strengths: ['Mobilità', 'Buona difesa senza armatura'], considerations: ['Dipende da Destrezza e Saggezza'],
    suggestions: ['Evita di restare isolato nonostante la mobilità.'],
  }),
  makeClass({
    id: 'paladin', nameIt: 'Paladino', page: 70, icon: '✠', role: 'Difensore sacro',
    shortDescription: 'Un guerriero consacrato che protegge gli alleati con armi, armatura e magia.',
    primaryAbility: 'strength', primaryAbilities: ['strength', 'charisma'], complexity: 'media',
    styles: ['mischia', 'magia', 'supporto'], filters: ['marziali', 'incantatori', 'supporto', 'mischia'], hitDie: 10,
    armorProficiencies: ['Armature leggere', 'Armature medie', 'Armature pesanti', 'Scudi'],
    weaponProficiencies: ['Armi semplici', 'Armi da guerra'], toolProficiencies: [],
    savingThrows: ['wisdom', 'charisma'], skillChoices: skills.paladin, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Cotta di maglia, scudo, spada lunga, 6 giavellotti, simbolo sacro, dotazione da sacerdote e 9 mo' }],
    goldAlternative: 150, weaponMasteryCount: 2,
    spellcasting: { ability: 'charisma', cantrips: 0, preparedSpells: 2, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'lay-on-hands', nameIt: 'Imposizione delle mani', summary: 'Usa una riserva di guarigione tramite azione bonus.', level: 1 },
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '2 incantesimi preparati e 2 slot di 1º livello; nessun trucchetto di classe.', level: 1 },
      { id: 'weapon-mastery', nameIt: 'Padronanza d’armi', summary: 'Sceglie due armi di cui usare le proprietà di padronanza.', level: 1 },
    ],
    requiredChoices: [{ id: 'weapon-mastery', label: 'Padronanze nelle armi', count: 2, options: masteryWeapons }],
    howToPlay: 'Resta vicino agli alleati, cura quando serve e usa armi e magia con decisione.',
    strengths: ['Armature pesanti', 'Cura e magia'], considerations: ['Molte risorse diverse'],
    suggestions: ['Forza sostiene le armi; Carisma sostiene gli incantesimi.'],
  }),
  makeClass({
    id: 'ranger', nameIt: 'Ranger', page: 75, icon: '➶', role: 'Esploratore marziale',
    shortDescription: 'Un esploratore che combina armi, competenze e magia della natura.',
    primaryAbility: 'dexterity', primaryAbilities: ['dexterity', 'wisdom'], complexity: 'media',
    styles: ['distanza', 'mischia', 'magia', 'utilità'], filters: ['marziali', 'incantatori', 'distanza', 'mischia'], hitDie: 10,
    armorProficiencies: ['Armature leggere', 'Armature medie', 'Scudi'],
    weaponProficiencies: ['Armi semplici', 'Armi da guerra'], toolProficiencies: [],
    savingThrows: ['strength', 'dexterity'], skillChoices: skills.ranger, skillChoiceCount: 3,
    startingEquipment: [{ id: 'a', label: 'Cuoio borchiato, scimitarra, spada corta, arco lungo, 20 frecce, faretra, focus druidico, dotazione da esploratore e 7 mo' }],
    goldAlternative: 150, weaponMasteryCount: 2,
    spellcasting: { ability: 'wisdom', cantrips: 0, preparedSpells: 2, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '2 incantesimi preparati e 2 slot di 1º livello; nessun trucchetto di classe.', level: 1 },
      { id: 'favored-enemy', nameIt: 'Nemico prescelto', summary: 'Ha Marchio del cacciatore sempre preparato e usi gratuiti.', level: 1 },
      { id: 'weapon-mastery', nameIt: 'Padronanza d’armi', summary: 'Sceglie due armi di cui usare le proprietà di padronanza.', level: 1 },
    ],
    requiredChoices: [{ id: 'weapon-mastery', label: 'Padronanze nelle armi', count: 2, options: masteryWeapons }],
    howToPlay: 'Esplora, individua minacce e combina Marchio del cacciatore con armi adatte.',
    strengths: ['Esplorazione', 'Efficace a distanza e in mischia'], considerations: ['Gestione di magia e armi'],
    suggestions: ['Destrezza e Saggezza sostengono le funzioni principali.'],
  }),
  makeClass({
    id: 'sorcerer', nameIt: 'Stregone', page: 79, icon: '✹', role: 'Incantatore innato',
    shortDescription: 'Un incantatore che libera una magia potente e personale.',
    primaryAbility: 'charisma', primaryAbilities: ['charisma'], complexity: 'media',
    styles: ['magia', 'distanza'], filters: ['incantatori', 'distanza'], hitDie: 6,
    armorProficiencies: [], weaponProficiencies: ['Armi semplici'], toolProficiencies: [],
    savingThrows: ['constitution', 'charisma'], skillChoices: skills.sorcerer, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Lancia, 2 pugnali, focus arcano (cristallo), dotazione da avventuriero e 28 mo' }],
    goldAlternative: 50, weaponMasteryCount: 0,
    spellcasting: { ability: 'charisma', cantrips: 4, preparedSpells: 2, levelOneSlots: 2 },
    levelOneFeatures: [
      { id: 'spellcasting', nameIt: 'Incantesimi', summary: '4 trucchetti, 2 incantesimi preparati e 2 slot di 1º livello.', level: 1 },
      { id: 'innate-sorcery', nameIt: 'Stregoneria innata', summary: 'Azione bonus che potenzia temporaneamente gli incantesimi da stregone.', level: 1 },
    ],
    requiredChoices: [], howToPlay: 'Concentrati su pochi incantesimi e usa Stregoneria innata nei momenti decisivi.',
    strengths: ['Molti trucchetti', 'Magia offensiva diretta'], considerations: ['Pochi punti ferita', 'Lista preparata ridotta'],
    suggestions: ['Scegli incantesimi che coprano situazioni diverse.'],
  }),
  makeClass({
    id: 'warlock', nameIt: 'Warlock', page: 85, icon: '◈', role: 'Incantatore occulto',
    shortDescription: 'Un incantatore legato a un patto misterioso e a suppliche personalizzabili.',
    primaryAbility: 'charisma', primaryAbilities: ['charisma'], complexity: 'avanzata',
    styles: ['magia', 'distanza', 'utilità'], filters: ['incantatori', 'distanza'], hitDie: 8,
    armorProficiencies: ['Armature leggere'], weaponProficiencies: ['Armi semplici'], toolProficiencies: [],
    savingThrows: ['wisdom', 'charisma'], skillChoices: skills.warlock, skillChoiceCount: 2,
    startingEquipment: [{ id: 'a', label: 'Armatura di cuoio, falcetto, 2 pugnali, focus arcano (globo), libro di scienze occulte, dotazione da studioso e 15 mo' }],
    goldAlternative: 100, weaponMasteryCount: 0,
    spellcasting: { ability: 'charisma', cantrips: 2, preparedSpells: 2, levelOneSlots: 1 },
    levelOneFeatures: [
      { id: 'eldritch-invocations', nameIt: 'Suppliche occulte', summary: 'Sceglie una supplica di cui soddisfa i prerequisiti.', level: 1 },
      { id: 'pact-magic', nameIt: 'Magia del patto', summary: '2 trucchetti, 2 incantesimi preparati e 1 slot di 1º livello.', level: 1 },
    ],
    requiredChoices: [{
      id: 'eldritch-invocation', label: 'Supplica occulta', count: 1,
      options: [
        { id: 'armor-of-shadows', label: 'Armatura delle ombre' },
        { id: 'pact-of-chain', label: 'Patto della catena' },
        { id: 'pact-of-blade', label: 'Patto della lama' },
        { id: 'pact-of-tome', label: 'Patto del tomo' },
      ],
    }],
    howToPlay: 'Scegli una supplica che definisca il tuo stile e usa con attenzione lo slot del patto.',
    strengths: ['Personalizzazione', 'Slot recuperabile con riposo breve'], considerations: ['Un solo slot al 1º livello'],
    suggestions: ['La supplica scelta cambia sensibilmente il modo di giocare.'],
  }),
]

const choice = (id: string, label: string, options: string[], count = 1) => ({
  id, label, count, options: options.map((value) => ({ id: value.toLocaleLowerCase('it').replaceAll(' ', '-'), label: value })),
})

const makeSpecies = (
  entry: Omit<Species, 'source' | 'abilityScoreIncreases'> & { page: number },
): Species => ({
  ...entry,
  source: source(`Specie: ${entry.nameIt}`, entry.page),
  abilityScoreIncreases: [],
})

export const speciesOptions: Species[] = [
  makeSpecies({
    id: 'dragonborn', nameIt: 'Dragonide', page: 94, icon: '◒', creatureType: 'Umanoide', size: 'Media',
    speedMeters: 9, darkvisionMeters: 18, resistances: ['Determinata dalla Discendenza draconica'], proficiencies: [],
    complexity: 'media', shortDescription: 'Un’eredità draconica definisce soffio e resistenza.',
    traits: [
      { id: 'draconic-ancestry', nameIt: 'Discendenza draconica', summary: 'Sceglie un drago e il relativo tipo di danno.', level: 1 },
      { id: 'breath-weapon', nameIt: 'Soffio', summary: 'Sostituisce un attacco: cono di 4,5 m o linea di 9 × 1,5 m; TS Des CD 8 + Cos + competenza; 1d10 danni (metà con successo). Usi pari al bonus di competenza, recupero lungo.', level: 1 },
      { id: 'damage-resistance', nameIt: 'Resistenza ai danni', summary: 'Resistenza al tipo di danno dell’ascendenza.', level: 1 },
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 18 metri.', level: 1 },
      { id: 'draconic-flight', nameIt: 'Volo draconico', summary: 'Ottiene temporaneamente velocità di volo pari alla velocità.', level: 5 },
    ],
    speciesSpells: [],
    requiredChoices: [choice('draconic-ancestry', 'Discendenza draconica', ['Argento — freddo', 'Bianco — freddo', 'Blu — fulmine', 'Bronzo — fulmine', 'Nero — acido', 'Oro — fuoco', 'Ottone — fuoco', 'Rame — acido', 'Rosso — fuoco', 'Verde — veleno'])],
  }),
  makeSpecies({
    id: 'dwarf', nameIt: 'Nano', page: 96, icon: '◆', creatureType: 'Umanoide', size: 'Media',
    speedMeters: 9, darkvisionMeters: 36, resistances: ['Danni da veleno'], proficiencies: [],
    complexity: 'facile', shortDescription: 'Tenacia, sensi sotterranei e resistenza straordinaria.',
    traits: [
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 36 metri.', level: 1 },
      { id: 'dwarven-resilience', nameIt: 'Resilienza nanica', summary: 'Resistenza al veleno e vantaggio per evitare o terminare Avvelenato.', level: 1 },
      { id: 'stonecunning', nameIt: 'Esperto minatore', summary: 'Percezione tellurica entro 18 metri su pietra per 10 minuti; usi pari al bonus di competenza, recupero lungo.', level: 1 },
      { id: 'toughness', nameIt: 'Robustezza nanica', summary: 'Il massimo dei punti ferita aumenta di 1 per livello.', level: 1 },
    ],
    speciesSpells: [], requiredChoices: [],
  }),
  makeSpecies({
    id: 'elf', nameIt: 'Elfo', page: 94, icon: '❧', creatureType: 'Umanoide', size: 'Media',
    speedMeters: 9, darkvisionMeters: 18, resistances: [], proficiencies: ['Una tra Intuizione, Percezione e Sopravvivenza'],
    complexity: 'avanzata', shortDescription: 'Un lignaggio fatato conferisce sensi e magia distintivi.',
    traits: [
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 18 metri; il Drow la estende a 36 metri.', level: 1 },
      { id: 'fey-ancestry', nameIt: 'Retaggio fatato', summary: 'Vantaggio per evitare o terminare la condizione Affascinato.', level: 1 },
      { id: 'keen-senses', nameIt: 'Sensi acuti', summary: 'Competenza in Intuizione, Percezione o Sopravvivenza.', level: 1 },
      { id: 'trance', nameIt: 'Trance', summary: 'Completa un riposo lungo in 4 ore di meditazione.', level: 1 },
      { id: 'elven-lineage', nameIt: 'Lignaggio elfico', summary: 'Drow: scurovisione 36 m e Luci danzanti; Elfo alto: Prestidigitazione sostituibile dopo un riposo lungo; Elfo dei boschi: velocità 10,5 m e Artificio druidico. Gli incantesimi di livello 3 e 5 sono sempre preparati, si lanciano gratis una volta per riposo lungo oppure con slot.', level: 1 },
    ],
    speciesSpells: [
      { nameIt: 'Luci danzanti / Prestidigitazione / Artificio druidico (secondo lignaggio)', levelGained: 1 },
      { nameIt: 'Luminescenza / Individuazione del magico / Passo veloce (secondo lignaggio)', levelGained: 3 },
      { nameIt: 'Oscurità / Passo velato / Passare senza tracce (secondo lignaggio)', levelGained: 5 },
    ],
    requiredChoices: [
      choice('elven-lineage', 'Lignaggio elfico', ['Drow', 'Elfo alto', 'Elfo dei boschi']),
      choice('spellcasting-ability', 'Caratteristica da incantatore', ['Intelligenza', 'Saggezza', 'Carisma']),
      choice('keen-senses', 'Sensi acuti', ['Intuizione', 'Percezione', 'Sopravvivenza']),
    ],
  }),
  makeSpecies({
    id: 'gnome', nameIt: 'Gnomo', page: 95, icon: '✦', creatureType: 'Umanoide', size: 'Piccola',
    speedMeters: 9, darkvisionMeters: 18, resistances: [], proficiencies: [],
    complexity: 'media', shortDescription: 'Astuzia e lignaggio determinano talenti magici peculiari.',
    traits: [
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 18 metri.', level: 1 },
      { id: 'gnomish-cunning', nameIt: 'Astuzia gnomesca', summary: 'Vantaggio ai tiri salvezza su Intelligenza, Saggezza e Carisma.', level: 1 },
      { id: 'gnomish-lineage', nameIt: 'Lignaggio gnomesco', summary: 'Foreste: Illusione minore e Parlare con gli animali sempre preparato, con usi gratuiti pari alla competenza per riposo lungo. Rocce: Prestidigitazione e Riparare, più congegni meccanici creati in 10 minuti.', level: 1 },
    ],
    speciesSpells: [
      { nameIt: 'Illusione minore e Parlare con gli animali (Foreste)', levelGained: 1 },
      { nameIt: 'Prestidigitazione e Riparare (Rocce)', levelGained: 1 },
    ],
    requiredChoices: [
      choice('gnomish-lineage', 'Lignaggio gnomesco', ['Gnomo delle foreste', 'Gnomo delle rocce']),
      choice('spellcasting-ability', 'Caratteristica da incantatore', ['Intelligenza', 'Saggezza', 'Carisma']),
    ],
  }),
  makeSpecies({
    id: 'goliath', nameIt: 'Goliath', page: 95, icon: '▲', creatureType: 'Umanoide', size: 'Media',
    speedMeters: 10.5, darkvisionMeters: null, resistances: [], proficiencies: [],
    complexity: 'media', shortDescription: 'Una discendenza giantica conferisce una capacità potente e distintiva.',
    traits: [
      { id: 'giant-ancestry', nameIt: 'Discendenza giantica', summary: 'Sceglie una capacità tra sei discendenze; usi pari al bonus di competenza, recupero lungo.', level: 1 },
      { id: 'frost-chill', nameIt: 'Brivido gelante', summary: 'Dopo aver colpito e inflitto danni: +1d6 freddo e velocità del bersaglio ridotta di 3 m fino al turno successivo.', level: 1 },
      { id: 'hill-tumble', nameIt: 'Forza della collina', summary: 'Dopo aver colpito e inflitto danni a una creatura Grande o inferiore, può farla cadere prona.', level: 1 },
      { id: 'fire-burn', nameIt: 'Fuoco bruciante', summary: 'Dopo aver colpito e inflitto danni, infligge 1d10 danni da fuoco aggiuntivi.', level: 1 },
      { id: 'stone-endurance', nameIt: 'Resistenza della pietra', summary: 'Reazione quando subisce danni: riduzione pari a 1d12 + modificatore di Costituzione.', level: 1 },
      { id: 'cloud-jaunt', nameIt: 'Salto-nuvola', summary: 'Azione bonus: teletrasporto fino a 9 m in uno spazio libero visibile.', level: 1 },
      { id: 'storm-thunder', nameIt: 'Tuono tempestoso', summary: 'Reazione quando subisce danni da una creatura entro 18 m: le infligge 1d8 danni da tuono.', level: 1 },
      { id: 'powerful-build', nameIt: 'Costituzione robusta', summary: 'Vantaggio per terminare Afferrato e capacità di carico come una taglia superiore.', level: 1 },
      { id: 'large-form', nameIt: 'Forma grande', summary: 'Diventa di taglia Grande per 10 minuti una volta per riposo lungo.', level: 5 },
    ],
    speciesSpells: [],
    requiredChoices: [choice('giant-ancestry', 'Discendenza giantica', ['Brivido gelante (gigante del gelo)', 'Forza della collina (gigante della collina)', 'Fuoco bruciante (gigante del fuoco)', 'Resistenza della pietra (gigante della pietra)', 'Salto-nuvola (gigante delle nuvole)', 'Tuono tempestoso (gigante della tempesta)'])],
  }),
  makeSpecies({
    id: 'halfling', nameIt: 'Halfling', page: 96, icon: '●', creatureType: 'Umanoide', size: 'Piccola',
    speedMeters: 9, darkvisionMeters: null, resistances: [], proficiencies: [],
    complexity: 'facile', shortDescription: 'Fortuna, coraggio e agilità aiutano a superare ostacoli più grandi.',
    traits: [
      { id: 'brave', nameIt: 'Coraggio', summary: 'Vantaggio per evitare o terminare Spaventato.', level: 1 },
      { id: 'halfling-nimbleness', nameIt: 'Agilità halfling', summary: 'Può attraversare lo spazio di creature di taglia superiore.', level: 1 },
      { id: 'luck', nameIt: 'Fortuna', summary: 'Ritira un 1 naturale nelle prove con d20.', level: 1 },
      { id: 'naturally-stealthy', nameIt: 'Furtività innata', summary: 'Può Nascondersi anche oscurato solo da una creatura più grande.', level: 1 },
    ],
    speciesSpells: [], requiredChoices: [],
  }),
  makeSpecies({
    id: 'human', nameIt: 'Umano', page: 97, icon: '◇', creatureType: 'Umanoide', size: 'Media o Piccola',
    speedMeters: 9, darkvisionMeters: null, resistances: [], proficiencies: ['Un’abilità a scelta'],
    complexity: 'media', shortDescription: 'Intraprendenza, versatilità e un talento dell’Origine a scelta.',
    traits: [
      { id: 'resourceful', nameIt: 'Intraprendente', summary: 'Ottiene Ispirazione eroica al termine di un riposo lungo.', level: 1 },
      { id: 'skillful', nameIt: 'Pluriabilità', summary: 'Ottiene competenza in un’abilità a scelta.', level: 1 },
      { id: 'versatile', nameIt: 'Versatile', summary: 'Ottiene un talento della categoria Origini a scelta.', level: 1 },
    ],
    speciesSpells: [],
    requiredChoices: [
      choice('size', 'Taglia', ['Media', 'Piccola']),
      choice('human-skill', 'Competenza in un’abilità', skills.bard),
      choice('origin-feat', 'Talento dell’Origine', ['Abile', 'Aggressore selvaggio', 'Allerta', 'Iniziato alla magia']),
    ],
  }),
  makeSpecies({
    id: 'orc', nameIt: 'Orco', page: 96, icon: '⬟', creatureType: 'Umanoide', size: 'Media',
    speedMeters: 9, darkvisionMeters: 36, resistances: [], proficiencies: [],
    complexity: 'facile', shortDescription: 'Slancio, resistenza e scurovisione sostengono un avventuriero tenace.',
    traits: [
      { id: 'adrenaline-rush', nameIt: 'Scarica di adrenalina', summary: 'Scatto come azione bonus e punti ferita temporanei; usi pari al bonus di competenza, recupero breve o lungo.', level: 1 },
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 36 metri.', level: 1 },
      { id: 'relentless-endurance', nameIt: 'Resistenza implacabile', summary: 'Quando scende a 0 punti ferita, resta a 1 una volta per riposo lungo.', level: 1 },
    ],
    speciesSpells: [], requiredChoices: [],
  }),
  makeSpecies({
    id: 'tiefling', nameIt: 'Tiefling', page: 96, icon: '♢', creatureType: 'Umanoide', size: 'Media o Piccola',
    speedMeters: 9, darkvisionMeters: 18, resistances: ['Determinata dal Retaggio immondo'], proficiencies: [],
    complexity: 'avanzata', shortDescription: 'Un retaggio immondo determina resistenza e magia innata.',
    traits: [
      { id: 'darkvision', nameIt: 'Scurovisione', summary: 'Scurovisione entro 18 metri.', level: 1 },
      { id: 'fiendish-legacy', nameIt: 'Retaggio immondo', summary: 'Abissale: veleno, Spruzzo velenoso, Raggio di infermità e Blocca persone. Ctonio: necrotico, Tocco gelido, Vita falsata e Raggio di affaticamento. Infernale: fuoco, Dardo di fuoco, Intimorire infernale e Oscurità. Gli incantesimi di livello 3 e 5 si lanciano gratis una volta per riposo lungo oppure con slot.', level: 1 },
      { id: 'otherworldly-presence', nameIt: 'Presenza ultraterrena', summary: 'Conosce il trucchetto Taumaturgia.', level: 1 },
    ],
    speciesSpells: [
      { nameIt: 'Spruzzo velenoso / Tocco gelido / Dardo di fuoco (secondo eredità)', levelGained: 1 },
      { nameIt: 'Raggio di infermità / Vita falsata / Intimorire infernale (secondo eredità)', levelGained: 3 },
      { nameIt: 'Blocca persone / Raggio di affaticamento / Oscurità (secondo eredità)', levelGained: 5 },
    ],
    requiredChoices: [
      choice('size', 'Taglia', ['Media', 'Piccola']),
      choice('fiendish-legacy', 'Retaggio immondo', ['Abissale', 'Ctonio', 'Infernale']),
      choice('spellcasting-ability', 'Caratteristica da incantatore', ['Intelligenza', 'Saggezza', 'Carisma']),
    ],
  }),
]

export const PHB_AASIMAR_PRESENTATION = {
  id: 'aasimar-phb-2024',
  nameIt: 'Aasimar',
  icon: '✧',
  source: {
    sourceId: 'phb-2024', sourceTitle: 'Manuale del Giocatore 2024', sourceSection: 'Specie: Aasimar',
    license: 'Proprietario' as const, ruleset: 'dnd-2024', isSrdContent: false, requiresOfficialBook: true,
  },
} as const

export const inspirationOptions = [
  { id: 'brave-fighter', nameIt: 'Combattente coraggioso', icon: '⚔', description: 'Affronta il pericolo in prima linea.' },
  { id: 'stealth-explorer', nameIt: 'Esploratore furtivo', icon: '◒', description: 'Osserva e agisce senza farsi notare.' },
  { id: 'spellcaster', nameIt: 'Incantatore', icon: '✦', description: 'Affida alla magia le soluzioni più sorprendenti.' },
  { id: 'protector', nameIt: 'Guaritore e protettore', icon: '✚', description: 'Sostiene il gruppo nelle difficoltà.' },
  { id: 'custom', nameIt: 'Personaggio personalizzato', icon: '◇', description: 'Segui un’idea tutta tua.' },
] as const

export const backgroundOptions: Background[] = [
  ['acolyte', 'Accolito', 'Una vita dedicata al servizio e alla conoscenza spirituale.', '✦', 93],
  ['criminal', 'Criminale', 'Esperienza con discrezione, contatti e attività clandestine.', '◈', 93],
  ['sage', 'Sapiente', 'Anni dedicati a studio, archivi e conoscenze.', '⌘', 93],
  ['soldier', 'Soldato', 'Disciplina e addestramento maturati nel servizio militare.', '⚑', 93],
].map(([id, nameIt, shortDescription, icon, page]) => ({
  id: String(id), nameIt: String(nameIt), shortDescription: String(shortDescription), icon: String(icon),
  source: source(`Background: ${nameIt}`, Number(page)), requiredChoices: [],
}))

export const backgroundDetermines = [
  'Aumenti delle caratteristiche', 'Due competenze nelle abilità', 'Una competenza con uno strumento',
  'Equipaggiamento iniziale o denaro', 'Un Talento dell’Origine',
] as const

export const speciesPrinciples = [
  'I tratti delle nove specie SRD sono tratti dal SRD 5.2.1 italiano',
  'La specie non assegna aumenti alle caratteristiche',
] as const

export const languageOptions = [
  { id: 'common', nameIt: 'Comune', description: 'Linguaggio comune standard.' },
  { id: 'common-sign', nameIt: 'Lingua dei Segni Comune', description: 'Linguaggio standard gestuale.' },
  { id: 'draconic', nameIt: 'Draconico', description: 'Linguaggio raro.' },
  { id: 'dwarvish', nameIt: 'Nanico', description: 'Linguaggio standard.' },
  { id: 'elvish', nameIt: 'Elfico', description: 'Linguaggio standard.' },
  { id: 'giant', nameIt: 'Gigante', description: 'Linguaggio raro.' },
  { id: 'gnomish', nameIt: 'Gnomesco', description: 'Linguaggio standard.' },
  { id: 'goblin', nameIt: 'Goblin', description: 'Linguaggio standard.' },
  { id: 'halfling', nameIt: 'Halfling', description: 'Linguaggio standard.' },
  { id: 'orc', nameIt: 'Orchesco', description: 'Linguaggio standard.' },
] as const

export const abilityDefinitions: AbilityScore[] = [
  { id: 'strength', nameIt: 'Forza', icon: '◆', simpleDescription: 'Potenza fisica.', examples: ['Sollevare', 'Spingere', 'Colpire'] },
  { id: 'dexterity', nameIt: 'Destrezza', icon: '➶', simpleDescription: 'Agilità e precisione.', examples: ['Muoversi', 'Schivare', 'Mirare'] },
  { id: 'constitution', nameIt: 'Costituzione', icon: '⬟', simpleDescription: 'Resistenza fisica.', examples: ['Resistere', 'Sopportare', 'Perseverare'] },
  { id: 'intelligence', nameIt: 'Intelligenza', icon: '✦', simpleDescription: 'Memoria e ragionamento.', examples: ['Ricordare', 'Indagare', 'Studiare'] },
  { id: 'wisdom', nameIt: 'Saggezza', icon: '◉', simpleDescription: 'Percezione e intuito.', examples: ['Notare', 'Capire', 'Orientarsi'] },
  { id: 'charisma', nameIt: 'Carisma', icon: '✧', simpleDescription: 'Presenza personale.', examples: ['Convincere', 'Ispirare', 'Intimidire'] },
]

export const builderSteps: BuilderStep[] = [
  ['intro', 'Prologo', 'Inizia una nuova leggenda', 'Dai un nome e un’idea al personaggio.', '✦'],
  ['class', 'Capitolo I', 'Scegli la tua classe', 'Tutte le 12 classi base dello SRD 5.2.1.', '⚔'],
  ['background', 'Capitolo II', 'Da dove vieni?', 'Scegli un Background ufficiale SRD.', '⌘'],
  ['species', 'Capitolo III', 'Scegli la tua specie', 'Nove specie SRD e Aasimar con manuale richiesto.', '❧'],
  ['languages', 'Capitolo IV', 'Le parole del mondo', 'Scegli due linguaggi.', '◈'],
  ['abilities', 'Capitolo V', 'Dai forma alle caratteristiche', 'Assegna la serie standard.', '◆'],
  ['class-choices', 'Capitolo VI', 'Scelte della classe e della specie', 'Completa competenze e scelte obbligatorie.', '⚜'],
  ['equipment', 'Capitolo VII', 'Preparati al viaggio', 'Scegli equipaggiamento o monete.', '⚒'],
  ['spells', 'Capitolo VIII', 'Prepara la tua magia', 'Riepiloga la progressione magica di livello 1.', '✧'],
  ['personality', 'Capitolo IX', 'Rendi unico il tuo eroe', 'Dagli una voce e una storia.', '❦'],
  ['summary', 'Epilogo', 'La leggenda prende forma', 'Controlla tutte le scelte.', '✓'],
].map(([id, chapter, title, shortDescription, icon]) => ({
  id: id as BuilderStep['id'], chapter, title, shortDescription, icon,
  sageGuide: {
    explanation: 'Le scelte meccaniche mostrate sono collegate ai dati strutturati del catalogo.',
    usefulness: 'Il riepilogo laterale si aggiorna automaticamente.',
    suggestion: 'Puoi tornare indietro senza perdere i dati.',
    ruleLabel: id === 'intro' || id === 'personality' ? 'Scelta libera' : 'Richiesto dalle regole',
  },
}))

export const personalityPrompts = {
  appearance: { label: 'Aspetto', help: 'Come lo riconoscerebbero?', example: 'Descrivi un dettaglio memorabile.' },
  personality: { label: 'Personalità', help: 'Come reagisce alle difficoltà?', example: 'Una frase è sufficiente.' },
  ideal: { label: 'Ideale', help: 'Quale principio segue?', example: 'Ciò che non vuole tradire.' },
  bond: { label: 'Legame', help: 'Chi o cosa protegge?', example: 'Una persona, un luogo o una promessa.' },
  flaw: { label: 'Difetto', help: 'Cosa gli crea problemi?', example: 'Un limite interessante.' },
  backstory: { label: 'Storia', help: 'Perché è diventato avventuriero?', example: 'Racconta l’evento decisivo.' },
  alignment: { label: 'Allineamento', help: 'Come affronta regole e responsabilità?', example: 'Descrivilo con parole tue.' },
} as const

export function abilityLabel(key: AbilityKey): string {
  return abilityDefinitions.find((ability) => ability.id === key)?.nameIt ?? key
}
