// Ghana Administrative Divisions: Regions -> Constituencies -> Districts

export interface District {
  name: string;
  capital?: string;
}

export interface Constituency {
  name: string;
  districts: District[];
}

export interface Region {
  name: string;
  capital: string;
  constituencies: Constituency[];
}

export const GHANA_REGIONS: Region[] = [
  {
    name: 'Greater Accra',
    capital: 'Accra',
    constituencies: [
      {
        name: 'Ablekuma Central',
        districts: [
          { name: 'Ablekuma Central Municipal' },
        ],
      },
      {
        name: 'Ablekuma North',
        districts: [
          { name: 'Ablekuma North Municipal' },
        ],
      },
      {
        name: 'Ablekuma South',
        districts: [
          { name: 'Ablekuma South Municipal' },
        ],
      },
      {
        name: 'Ablekuma West',
        districts: [
          { name: 'Ablekuma West Municipal' },
        ],
      },
      {
        name: 'Accra Central',
        districts: [
          { name: 'Accra Metropolitan', capital: 'Accra' },
        ],
      },
      {
        name: 'Ada',
        districts: [
          { name: 'Ada East District' },
          { name: 'Ada West District' },
        ],
      },
      {
        name: 'Adentan',
        districts: [
          { name: 'Adentan Municipal' },
        ],
      },
      {
        name: 'Ashaiman',
        districts: [
          { name: 'Ashaiman Municipal' },
        ],
      },
      {
        name: 'Ayawaso Central',
        districts: [
          { name: 'Ayawaso Central Municipal' },
        ],
      },
      {
        name: 'Ayawaso East',
        districts: [
          { name: 'Ayawaso East Municipal' },
        ],
      },
      {
        name: 'Ayawaso North',
        districts: [
          { name: 'Ayawaso North Municipal' },
        ],
      },
      {
        name: 'Ayawaso West',
        districts: [
          { name: 'Ayawaso West Municipal' },
        ],
      },
      {
        name: 'Bortianor-Ngleshie Amanfro',
        districts: [
          { name: 'Ga South Municipal' },
        ],
      },
      {
        name: 'Dade Kotopon',
        districts: [
          { name: 'La Dade Kotopon Municipal' },
        ],
      },
      {
        name: 'Dome-Kwabenya',
        districts: [
          { name: 'Ga East Municipal' },
        ],
      },
      {
        name: 'Klottey Korle',
        districts: [
          { name: 'Klottey Korle Municipal' },
        ],
      },
      {
        name: 'Korle Klottey',
        districts: [
          { name: 'Korle Klottey Municipal' },
        ],
      },
      {
        name: 'Kpone Katamanso',
        districts: [
          { name: 'Kpone Katamanso Municipal' },
        ],
      },
      {
        name: 'Krowor',
        districts: [
          { name: 'Krowor Municipal' },
        ],
      },
      {
        name: 'La Dadekotopon',
        districts: [
          { name: 'La Dadekotopon Municipal' },
        ],
      },
      {
        name: 'La Nkwantanang Madina',
        districts: [
          { name: 'La Nkwantanang Madina Municipal' },
        ],
      },
      {
        name: 'Ledzokuku',
        districts: [
          { name: 'Ledzokuku Municipal' },
        ],
      },
      {
        name: 'Madina',
        districts: [
          { name: 'La Nkwantanang Madina Municipal' },
        ],
      },
      {
        name: 'Ningo Prampram',
        districts: [
          { name: 'Ningo Prampram District' },
        ],
      },
      {
        name: 'Odododiodio',
        districts: [
          { name: 'Odododiodio Municipal' },
        ],
      },
      {
        name: 'Okaikwei Central',
        districts: [
          { name: 'Okaikwei Central Municipal' },
        ],
      },
      {
        name: 'Okaikwei North',
        districts: [
          { name: 'Okaikwei North Municipal' },
        ],
      },
      {
        name: 'Okaikwei South',
        districts: [
          { name: 'Okaikwei South Municipal' },
        ],
      },
      {
        name: 'Shai Osudoku',
        districts: [
          { name: 'Shai Osudoku District' },
        ],
      },
      {
        name: 'Tema Central',
        districts: [
          { name: 'Tema Metropolitan' },
        ],
      },
      {
        name: 'Tema East',
        districts: [
          { name: 'Tema Metropolitan' },
        ],
      },
      {
        name: 'Tema West',
        districts: [
          { name: 'Tema West Municipal' },
        ],
      },
      {
        name: 'Trobu',
        districts: [
          { name: 'Ga North Municipal' },
        ],
      },
      {
        name: 'Weija Gbawe',
        districts: [
          { name: 'Weija Gbawe Municipal' },
        ],
      },
    ],
  },
  {
    name: 'Ashanti',
    capital: 'Kumasi',
    constituencies: [
      {
        name: 'Afigya Kwabre North',
        districts: [
          { name: 'Afigya Kwabre North District' },
        ],
      },
      {
        name: 'Afigya Kwabre South',
        districts: [
          { name: 'Afigya Kwabre South District' },
        ],
      },
      {
        name: 'Ahafo Ano North',
        districts: [
          { name: 'Ahafo Ano North Municipal' },
        ],
      },
      {
        name: 'Ahafo Ano South East',
        districts: [
          { name: 'Ahafo Ano South East District' },
        ],
      },
      {
        name: 'Ahafo Ano South West',
        districts: [
          { name: 'Ahafo Ano South West District' },
        ],
      },
      {
        name: 'Akrofuom',
        districts: [
          { name: 'Akrofuom District' },
        ],
      },
      {
        name: 'Amansie Central',
        districts: [
          { name: 'Amansie Central District' },
        ],
      },
      {
        name: 'Amansie South',
        districts: [
          { name: 'Amansie South District' },
        ],
      },
      {
        name: 'Amansie West',
        districts: [
          { name: 'Amansie West District' },
        ],
      },
      {
        name: 'Asante Akim Central',
        districts: [
          { name: 'Asante Akim Central Municipal' },
        ],
      },
      {
        name: 'Asante Akim North',
        districts: [
          { name: 'Asante Akim North District' },
        ],
      },
      {
        name: 'Asante Akim South',
        districts: [
          { name: 'Asante Akim South District' },
        ],
      },
      {
        name: 'Asawase',
        districts: [
          { name: 'Asokore Mampong Municipal' },
        ],
      },
      {
        name: 'Atwima Kwanwoma',
        districts: [
          { name: 'Atwima Kwanwoma District' },
        ],
      },
      {
        name: 'Atwima Mponua',
        districts: [
          { name: 'Atwima Mponua District' },
        ],
      },
      {
        name: 'Atwima Nwabiagya North',
        districts: [
          { name: 'Atwima Nwabiagya North District' },
        ],
      },
      {
        name: 'Atwima Nwabiagya South',
        districts: [
          { name: 'Atwima Nwabiagya Municipal' },
        ],
      },
      {
        name: 'Bantama',
        districts: [
          { name: 'Kumasi Metropolitan' },
        ],
      },
      {
        name: 'Bekwai',
        districts: [
          { name: 'Bekwai Municipal' },
        ],
      },
      {
        name: 'Bosome Freho',
        districts: [
          { name: 'Bosome Freho District' },
        ],
      },
      {
        name: 'Bosomtwe',
        districts: [
          { name: 'Bosomtwe District' },
        ],
      },
      {
        name: 'Ejisu',
        districts: [
          { name: 'Ejisu Municipal' },
        ],
      },
      {
        name: 'Ejura Sekyedumase',
        districts: [
          { name: 'Ejura Sekyedumase Municipal' },
        ],
      },
      {
        name: 'Fomena',
        districts: [
          { name: 'Adansi North District' },
        ],
      },
      {
        name: 'Juaben',
        districts: [
          { name: 'Juaben Municipal' },
        ],
      },
      {
        name: 'Kumasi Central',
        districts: [
          { name: 'Kumasi Metropolitan', capital: 'Kumasi' },
        ],
      },
      {
        name: 'Kwabre East',
        districts: [
          { name: 'Kwabre East Municipal' },
        ],
      },
      {
        name: 'Kwadaso',
        districts: [
          { name: 'Kwadaso Municipal' },
        ],
      },
      {
        name: 'Mampong',
        districts: [
          { name: 'Mampong Municipal' },
        ],
      },
      {
        name: 'Manso Adubia',
        districts: [
          { name: 'Amansie West District' },
        ],
      },
      {
        name: 'Manso Nkwanta',
        districts: [
          { name: 'Amansie South District' },
        ],
      },
      {
        name: 'New Edubiase',
        districts: [
          { name: 'Adansi South District' },
        ],
      },
      {
        name: 'Nhyiaeso',
        districts: [
          { name: 'Kumasi Metropolitan' },
        ],
      },
      {
        name: 'Nsuta Kwamang Beposo',
        districts: [
          { name: 'Sekyere Central District' },
        ],
      },
      {
        name: 'Obuasi East',
        districts: [
          { name: 'Obuasi Municipal' },
        ],
      },
      {
        name: 'Obuasi West',
        districts: [
          { name: 'Obuasi Municipal' },
        ],
      },
      {
        name: 'Odotobri',
        districts: [
          { name: 'Bosomtwe District' },
        ],
      },
      {
        name: 'Offinso North',
        districts: [
          { name: 'Offinso North District' },
        ],
      },
      {
        name: 'Offinso South',
        districts: [
          { name: 'Offinso Municipal' },
        ],
      },
      {
        name: 'Old Tafo',
        districts: [
          { name: 'Old Tafo Municipal' },
        ],
      },
      {
        name: 'Oforikrom',
        districts: [
          { name: 'Oforikrom Municipal' },
        ],
      },
      {
        name: 'Sekyere Afram Plains',
        districts: [
          { name: 'Sekyere Afram Plains District' },
        ],
      },
      {
        name: 'Sekyere East',
        districts: [
          { name: 'Sekyere East District' },
        ],
      },
      {
        name: 'Sekyere Kumawu',
        districts: [
          { name: 'Sekyere Kumawu District' },
        ],
      },
      {
        name: 'Suame',
        districts: [
          { name: 'Suame Municipal' },
        ],
      },
      {
        name: 'Subin',
        districts: [
          { name: 'Kumasi Metropolitan' },
        ],
      },
    ],
  },
  {
    name: 'Western',
    capital: 'Sekondi-Takoradi',
    constituencies: [
      {
        name: 'Ahanta West',
        districts: [
          { name: 'Ahanta West Municipal' },
        ],
      },
      {
        name: 'Effia',
        districts: [
          { name: 'Effia Kwesimintsim Municipal' },
        ],
      },
      {
        name: 'Ellembelle',
        districts: [
          { name: 'Ellembelle District' },
        ],
      },
      {
        name: 'Essikado Ketan',
        districts: [
          { name: 'Sekondi Takoradi Metropolitan' },
        ],
      },
      {
        name: 'Jomoro',
        districts: [
          { name: 'Jomoro District' },
        ],
      },
      {
        name: 'Kwesimintsim',
        districts: [
          { name: 'Effia Kwesimintsim Municipal' },
        ],
      },
      {
        name: 'Mpohor',
        districts: [
          { name: 'Mpohor District' },
        ],
      },
      {
        name: 'Nzema East',
        districts: [
          { name: 'Nzema East Municipal' },
        ],
      },
      {
        name: 'Prestea Huni Valley',
        districts: [
          { name: 'Prestea Huni Valley Municipal' },
        ],
      },
      {
        name: 'Sekondi',
        districts: [
          { name: 'Sekondi Takoradi Metropolitan', capital: 'Sekondi-Takoradi' },
        ],
      },
      {
        name: 'Shama',
        districts: [
          { name: 'Shama District' },
        ],
      },
      {
        name: 'Takoradi',
        districts: [
          { name: 'Sekondi Takoradi Metropolitan' },
        ],
      },
      {
        name: 'Tarkwa Nsuaem',
        districts: [
          { name: 'Tarkwa Nsuaem Municipal' },
        ],
      },
      {
        name: 'Wassa East',
        districts: [
          { name: 'Wassa East District' },
        ],
      },
    ],
  },
  {
    name: 'Central',
    capital: 'Cape Coast',
    constituencies: [
      {
        name: 'Abura Asebu Kwamankese',
        districts: [
          { name: 'Abura Asebu Kwamankese District' },
        ],
      },
      {
        name: 'Agona East',
        districts: [
          { name: 'Agona East District' },
        ],
      },
      {
        name: 'Agona West',
        districts: [
          { name: 'Agona West Municipal' },
        ],
      },
      {
        name: 'Ajumako Enyan Esiam',
        districts: [
          { name: 'Ajumako Enyan Esiam District' },
        ],
      },
      {
        name: 'Asikuma Odoben Brakwa',
        districts: [
          { name: 'Asikuma Odoben Brakwa District' },
        ],
      },
      {
        name: 'Assin Central',
        districts: [
          { name: 'Assin Central Municipal' },
        ],
      },
      {
        name: 'Assin North',
        districts: [
          { name: 'Assin North District' },
        ],
      },
      {
        name: 'Assin South',
        districts: [
          { name: 'Assin South District' },
        ],
      },
      {
        name: 'Awutu Senya East',
        districts: [
          { name: 'Awutu Senya East Municipal' },
        ],
      },
      {
        name: 'Awutu Senya West',
        districts: [
          { name: 'Awutu Senya West District' },
        ],
      },
      {
        name: 'Cape Coast North',
        districts: [
          { name: 'Cape Coast Metropolitan' },
        ],
      },
      {
        name: 'Cape Coast South',
        districts: [
          { name: 'Cape Coast Metropolitan', capital: 'Cape Coast' },
        ],
      },
      {
        name: 'Effutu',
        districts: [
          { name: 'Effutu Municipal' },
        ],
      },
      {
        name: 'Ekumfi',
        districts: [
          { name: 'Ekumfi District' },
        ],
      },
      {
        name: 'Gomoa Central',
        districts: [
          { name: 'Gomoa Central District' },
        ],
      },
      {
        name: 'Gomoa East',
        districts: [
          { name: 'Gomoa East District' },
        ],
      },
      {
        name: 'Gomoa West',
        districts: [
          { name: 'Gomoa West District' },
        ],
      },
      {
        name: 'Komenda Edina Eguafo Abirem',
        districts: [
          { name: 'Komenda Edina Eguafo Abirem Municipal' },
        ],
      },
      {
        name: 'Mfantseman',
        districts: [
          { name: 'Mfantseman Municipal' },
        ],
      },
      {
        name: 'Oguaa',
        districts: [
          { name: 'Cape Coast Metropolitan' },
        ],
      },
      {
        name: 'Twifo Atti Morkwa',
        districts: [
          { name: 'Twifo Atti Morkwa District' },
        ],
      },
      {
        name: 'Upper Denkyira East',
        districts: [
          { name: 'Upper Denkyira East Municipal' },
        ],
      },
      {
        name: 'Upper Denkyira West',
        districts: [
          { name: 'Upper Denkyira West District' },
        ],
      },
    ],
  },
  {
    name: 'Eastern',
    capital: 'Koforidua',
    constituencies: [
      {
        name: 'Abirem',
        districts: [
          { name: 'Birim North District' },
        ],
      },
      {
        name: 'Abuakwa North',
        districts: [
          { name: 'Abuakwa North Municipal' },
        ],
      },
      {
        name: 'Abuakwa South',
        districts: [
          { name: 'Abuakwa South Municipal' },
        ],
      },
      {
        name: 'Achiase',
        districts: [
          { name: 'Achiase District' },
        ],
      },
      {
        name: 'Afram Plains North',
        districts: [
          { name: 'Afram Plains North District' },
        ],
      },
      {
        name: 'Afram Plains South',
        districts: [
          { name: 'Afram Plains South District' },
        ],
      },
      {
        name: 'Akim Oda',
        districts: [
          { name: 'Birim Central Municipal' },
        ],
      },
      {
        name: 'Akim Swedru',
        districts: [
          { name: 'Birim South District' },
        ],
      },
      {
        name: 'Akuapem North',
        districts: [
          { name: 'Akuapem North Municipal' },
        ],
      },
      {
        name: 'Akuapem South',
        districts: [
          { name: 'Akuapem South District' },
        ],
      },
      {
        name: 'Akwatia',
        districts: [
          { name: 'Denkyembour District' },
        ],
      },
      {
        name: 'Akyem Mansa',
        districts: [
          { name: 'Asene Manso Akroso District' },
        ],
      },
      {
        name: 'Asene Manso Akroso',
        districts: [
          { name: 'Asene Manso Akroso District' },
        ],
      },
      {
        name: 'Asuogyaman',
        districts: [
          { name: 'Asuogyaman District' },
        ],
      },
      {
        name: 'Atiwa East',
        districts: [
          { name: 'Atiwa East District' },
        ],
      },
      {
        name: 'Atiwa West',
        districts: [
          { name: 'Atiwa West District' },
        ],
      },
      {
        name: 'Ayensuano',
        districts: [
          { name: 'Ayensuano District' },
        ],
      },
      {
        name: 'Fanteakwa North',
        districts: [
          { name: 'Fanteakwa North District' },
        ],
      },
      {
        name: 'Fanteakwa South',
        districts: [
          { name: 'Fanteakwa South District' },
        ],
      },
      {
        name: 'Kade',
        districts: [
          { name: 'Kwaebibirem District' },
        ],
      },
      {
        name: 'Koforidua',
        districts: [
          { name: 'New Juaben South Municipal', capital: 'Koforidua' },
        ],
      },
      {
        name: 'Kwahu Afram Plains North',
        districts: [
          { name: 'Kwahu Afram Plains North District' },
        ],
      },
      {
        name: 'Kwahu Afram Plains South',
        districts: [
          { name: 'Kwahu Afram Plains South District' },
        ],
      },
      {
        name: 'Kwahu East',
        districts: [
          { name: 'Kwahu East District' },
        ],
      },
      {
        name: 'Kwahu South',
        districts: [
          { name: 'Kwahu South District' },
        ],
      },
      {
        name: 'Kwahu West',
        districts: [
          { name: 'Kwahu West Municipal' },
        ],
      },
      {
        name: 'Lower Manya Krobo',
        districts: [
          { name: 'Lower Manya Krobo Municipal' },
        ],
      },
      {
        name: 'New Juaben North',
        districts: [
          { name: 'New Juaben North Municipal' },
        ],
      },
      {
        name: 'New Juaben South',
        districts: [
          { name: 'New Juaben South Municipal' },
        ],
      },
      {
        name: 'Nsawam Adoagyiri',
        districts: [
          { name: 'Nsawam Adoagyiri Municipal' },
        ],
      },
      {
        name: 'Nkawkaw',
        districts: [
          { name: 'Kwahu West Municipal' },
        ],
      },
      {
        name: 'Okere',
        districts: [
          { name: 'Okere District' },
        ],
      },
      {
        name: 'Suhum',
        districts: [
          { name: 'Suhum Municipal' },
        ],
      },
      {
        name: 'Upper Manya Krobo',
        districts: [
          { name: 'Upper Manya Krobo District' },
        ],
      },
      {
        name: 'Upper West Akim',
        districts: [
          { name: 'Upper West Akim District' },
        ],
      },
      {
        name: 'Yilo Krobo',
        districts: [
          { name: 'Yilo Krobo Municipal' },
        ],
      },
    ],
  },
  {
    name: 'Volta',
    capital: 'Ho',
    constituencies: [
      {
        name: 'Adaklu',
        districts: [
          { name: 'Adaklu District' },
        ],
      },
      {
        name: 'Afadjato South',
        districts: [
          { name: 'Afadjato South District' },
        ],
      },
      {
        name: 'Agotime Ziope',
        districts: [
          { name: 'Agotime Ziope District' },
        ],
      },
      {
        name: 'Akatsi North',
        districts: [
          { name: 'Akatsi North District' },
        ],
      },
      {
        name: 'Akatsi South',
        districts: [
          { name: 'Akatsi South District' },
        ],
      },
      {
        name: 'Anlo',
        districts: [
          { name: 'Anlo District' },
        ],
      },
      {
        name: 'Central Tongu',
        districts: [
          { name: 'Central Tongu District' },
        ],
      },
      {
        name: 'Ho Central',
        districts: [
          { name: 'Ho Municipal', capital: 'Ho' },
        ],
      },
      {
        name: 'Ho West',
        districts: [
          { name: 'Ho West District' },
        ],
      },
      {
        name: 'Hohoe',
        districts: [
          { name: 'Hohoe Municipal' },
        ],
      },
      {
        name: 'Keta',
        districts: [
          { name: 'Keta Municipal' },
        ],
      },
      {
        name: 'Ketu North',
        districts: [
          { name: 'Ketu North Municipal' },
        ],
      },
      {
        name: 'Ketu South',
        districts: [
          { name: 'Ketu South Municipal' },
        ],
      },
      {
        name: 'Kpando',
        districts: [
          { name: 'Kpando Municipal' },
        ],
      },
      {
        name: 'North Dayi',
        districts: [
          { name: 'North Dayi District' },
        ],
      },
      {
        name: 'North Tongu',
        districts: [
          { name: 'North Tongu District' },
        ],
      },
      {
        name: 'South Dayi',
        districts: [
          { name: 'South Dayi District' },
        ],
      },
      {
        name: 'South Tongu',
        districts: [
          { name: 'South Tongu District' },
        ],
      },
    ],
  },
  {
    name: 'Northern',
    capital: 'Tamale',
    constituencies: [
      {
        name: 'Gushegu',
        districts: [
          { name: 'Gushegu Municipal' },
        ],
      },
      {
        name: 'Karaga',
        districts: [
          { name: 'Karaga District' },
        ],
      },
      {
        name: 'Kpandai',
        districts: [
          { name: 'Kpandai District' },
        ],
      },
      {
        name: 'Kumbungu',
        districts: [
          { name: 'Kumbungu District' },
        ],
      },
      {
        name: 'Mion',
        districts: [
          { name: 'Mion District' },
        ],
      },
      {
        name: 'Nanton',
        districts: [
          { name: 'Nanton District' },
        ],
      },
      {
        name: 'Saboba',
        districts: [
          { name: 'Saboba District' },
        ],
      },
      {
        name: 'Sagnarigu',
        districts: [
          { name: 'Sagnarigu Municipal' },
        ],
      },
      {
        name: 'Savelugu',
        districts: [
          { name: 'Savelugu Municipal' },
        ],
      },
      {
        name: 'Tamale Central',
        districts: [
          { name: 'Tamale Metropolitan', capital: 'Tamale' },
        ],
      },
      {
        name: 'Tamale North',
        districts: [
          { name: 'Tamale Metropolitan' },
        ],
      },
      {
        name: 'Tamale South',
        districts: [
          { name: 'Tamale Metropolitan' },
        ],
      },
      {
        name: 'Tatale Sanguli',
        districts: [
          { name: 'Tatale Sanguli District' },
        ],
      },
      {
        name: 'Tolon',
        districts: [
          { name: 'Tolon District' },
        ],
      },
      {
        name: 'Yendi',
        districts: [
          { name: 'Yendi Municipal' },
        ],
      },
      {
        name: 'Zabzugu',
        districts: [
          { name: 'Zabzugu District' },
        ],
      },
    ],
  },
  {
    name: 'Upper East',
    capital: 'Bolgatanga',
    constituencies: [
      {
        name: 'Bawku Central',
        districts: [
          { name: 'Bawku Municipal' },
        ],
      },
      {
        name: 'Bawku West',
        districts: [
          { name: 'Bawku West District' },
        ],
      },
      {
        name: 'Binduri',
        districts: [
          { name: 'Binduri District' },
        ],
      },
      {
        name: 'Bolgatanga Central',
        districts: [
          { name: 'Bolgatanga Municipal', capital: 'Bolgatanga' },
        ],
      },
      {
        name: 'Bolgatanga East',
        districts: [
          { name: 'Bolgatanga East District' },
        ],
      },
      {
        name: 'Bongo',
        districts: [
          { name: 'Bongo District' },
        ],
      },
      {
        name: 'Builsa North',
        districts: [
          { name: 'Builsa North Municipal' },
        ],
      },
      {
        name: 'Builsa South',
        districts: [
          { name: 'Builsa South District' },
        ],
      },
      {
        name: 'Chiana Paga',
        districts: [
          { name: 'Kassena Nankana West District' },
        ],
      },
      {
        name: 'Garu',
        districts: [
          { name: 'Garu District' },
        ],
      },
      {
        name: 'Nabdam',
        districts: [
          { name: 'Nabdam District' },
        ],
      },
      {
        name: 'Navrongo Central',
        districts: [
          { name: 'Kassena Nankana Municipal' },
        ],
      },
      {
        name: 'Pusiga',
        districts: [
          { name: 'Pusiga District' },
        ],
      },
      {
        name: 'Talensi',
        districts: [
          { name: 'Talensi District' },
        ],
      },
      {
        name: 'Tempane',
        districts: [
          { name: 'Tempane District' },
        ],
      },
    ],
  },
  {
    name: 'Upper West',
    capital: 'Wa',
    constituencies: [
      {
        name: 'Daffiama Bussie Issa',
        districts: [
          { name: 'Daffiama Bussie Issa District' },
        ],
      },
      {
        name: 'Jirapa',
        districts: [
          { name: 'Jirapa Municipal' },
        ],
      },
      {
        name: 'Lambussie',
        districts: [
          { name: 'Lambussie Karni District' },
        ],
      },
      {
        name: 'Lawra',
        districts: [
          { name: 'Lawra Municipal' },
        ],
      },
      {
        name: 'Nadowli Kaleo',
        districts: [
          { name: 'Nadowli Kaleo District' },
        ],
      },
      {
        name: 'Nandom',
        districts: [
          { name: 'Nandom Municipal' },
        ],
      },
      {
        name: 'Sissala East',
        districts: [
          { name: 'Sissala East Municipal' },
        ],
      },
      {
        name: 'Sissala West',
        districts: [
          { name: 'Sissala West District' },
        ],
      },
      {
        name: 'Wa Central',
        districts: [
          { name: 'Wa Municipal', capital: 'Wa' },
        ],
      },
      {
        name: 'Wa East',
        districts: [
          { name: 'Wa East District' },
        ],
      },
      {
        name: 'Wa West',
        districts: [
          { name: 'Wa West District' },
        ],
      },
    ],
  },
  {
    name: 'Bono',
    capital: 'Sunyani',
    constituencies: [
      {
        name: 'Banda',
        districts: [
          { name: 'Banda District' },
        ],
      },
      {
        name: 'Berekum East',
        districts: [
          { name: 'Berekum Municipal' },
        ],
      },
      {
        name: 'Berekum West',
        districts: [
          { name: 'Berekum West District' },
        ],
      },
      {
        name: 'Dormaa Central',
        districts: [
          { name: 'Dormaa Municipal' },
        ],
      },
      {
        name: 'Dormaa East',
        districts: [
          { name: 'Dormaa East District' },
        ],
      },
      {
        name: 'Dormaa West',
        districts: [
          { name: 'Dormaa West District' },
        ],
      },
      {
        name: 'Jaman North',
        districts: [
          { name: 'Jaman North District' },
        ],
      },
      {
        name: 'Jaman South',
        districts: [
          { name: 'Jaman South Municipal' },
        ],
      },
      {
        name: 'Sunyani East',
        districts: [
          { name: 'Sunyani Municipal', capital: 'Sunyani' },
        ],
      },
      {
        name: 'Sunyani West',
        districts: [
          { name: 'Sunyani West Municipal' },
        ],
      },
      {
        name: 'Tain',
        districts: [
          { name: 'Tain District' },
        ],
      },
      {
        name: 'Wenchi',
        districts: [
          { name: 'Wenchi Municipal' },
        ],
      },
    ],
  },
  {
    name: 'Bono East',
    capital: 'Techiman',
    constituencies: [
      {
        name: 'Atebubu Amantin',
        districts: [
          { name: 'Atebubu Amantin Municipal' },
        ],
      },
      {
        name: 'Kintampo North',
        districts: [
          { name: 'Kintampo North Municipal' },
        ],
      },
      {
        name: 'Kintampo South',
        districts: [
          { name: 'Kintampo South District' },
        ],
      },
      {
        name: 'Nkoranza North',
        districts: [
          { name: 'Nkoranza North District' },
        ],
      },
      {
        name: 'Nkoranza South',
        districts: [
          { name: 'Nkoranza South Municipal' },
        ],
      },
      {
        name: 'Pru East',
        districts: [
          { name: 'Pru East District' },
        ],
      },
      {
        name: 'Pru West',
        districts: [
          { name: 'Pru West District' },
        ],
      },
      {
        name: 'Sene East',
        districts: [
          { name: 'Sene East District' },
        ],
      },
      {
        name: 'Sene West',
        districts: [
          { name: 'Sene West District' },
        ],
      },
      {
        name: 'Techiman North',
        districts: [
          { name: 'Techiman North District' },
        ],
      },
      {
        name: 'Techiman South',
        districts: [
          { name: 'Techiman Municipal', capital: 'Techiman' },
        ],
      },
    ],
  },
  {
    name: 'Ahafo',
    capital: 'Goaso',
    constituencies: [
      {
        name: 'Asunafo North',
        districts: [
          { name: 'Asunafo North Municipal' },
        ],
      },
      {
        name: 'Asunafo South',
        districts: [
          { name: 'Asunafo South District' },
        ],
      },
      {
        name: 'Asutifi North',
        districts: [
          { name: 'Asutifi North District' },
        ],
      },
      {
        name: 'Asutifi South',
        districts: [
          { name: 'Asutifi South District' },
        ],
      },
      {
        name: 'Tano North',
        districts: [
          { name: 'Tano North Municipal' },
        ],
      },
      {
        name: 'Tano South',
        districts: [
          { name: 'Tano South Municipal', capital: 'Goaso' },
        ],
      },
    ],
  },
  {
    name: 'Western North',
    capital: 'Sefwi Wiawso',
    constituencies: [
      {
        name: 'Aowin',
        districts: [
          { name: 'Aowin Municipal' },
        ],
      },
      {
        name: 'Bia East',
        districts: [
          { name: 'Bia East District' },
        ],
      },
      {
        name: 'Bia West',
        districts: [
          { name: 'Bia West District' },
        ],
      },
      {
        name: 'Bibiani Anhwiaso Bekwai',
        districts: [
          { name: 'Bibiani Anhwiaso Bekwai Municipal' },
        ],
      },
      {
        name: 'Bodi',
        districts: [
          { name: 'Bodi District' },
        ],
      },
      {
        name: 'Juaboso',
        districts: [
          { name: 'Juaboso District' },
        ],
      },
      {
        name: 'Sefwi Akontombra',
        districts: [
          { name: 'Sefwi Akontombra District' },
        ],
      },
      {
        name: 'Sefwi Wiawso',
        districts: [
          { name: 'Sefwi Wiawso Municipal', capital: 'Sefwi Wiawso' },
        ],
      },
      {
        name: 'Suaman',
        districts: [
          { name: 'Suaman District' },
        ],
      },
    ],
  },
  {
    name: 'Oti',
    capital: 'Dambai',
    constituencies: [
      {
        name: 'Biakoye',
        districts: [
          { name: 'Biakoye District' },
        ],
      },
      {
        name: 'Buem',
        districts: [
          { name: 'Jasikan District' },
        ],
      },
      {
        name: 'Guan',
        districts: [
          { name: 'Guan District' },
        ],
      },
      {
        name: 'Krachi East',
        districts: [
          { name: 'Krachi East Municipal', capital: 'Dambai' },
        ],
      },
      {
        name: 'Krachi Nchumuru',
        districts: [
          { name: 'Krachi Nchumuru District' },
        ],
      },
      {
        name: 'Krachi West',
        districts: [
          { name: 'Krachi West District' },
        ],
      },
      {
        name: 'Nkwanta North',
        districts: [
          { name: 'Nkwanta North District' },
        ],
      },
      {
        name: 'Nkwanta South',
        districts: [
          { name: 'Nkwanta South Municipal' },
        ],
      },
    ],
  },
  {
    name: 'Savannah',
    capital: 'Damongo',
    constituencies: [
      {
        name: 'Bole Bamboi',
        districts: [
          { name: 'Bole District' },
        ],
      },
      {
        name: 'Daboya Mankarigu',
        districts: [
          { name: 'North Gonja District' },
        ],
      },
      {
        name: 'Damongo',
        districts: [
          { name: 'West Gonja Municipal', capital: 'Damongo' },
        ],
      },
      {
        name: 'Salaga North',
        districts: [
          { name: 'East Gonja Municipal' },
        ],
      },
      {
        name: 'Salaga South',
        districts: [
          { name: 'East Gonja Municipal' },
        ],
      },
      {
        name: 'Sawla Tuna Kalba',
        districts: [
          { name: 'Sawla Tuna Kalba District' },
        ],
      },
      {
        name: 'Yapei Kusawgu',
        districts: [
          { name: 'Central Gonja District' },
        ],
      },
    ],
  },
  {
    name: 'North East',
    capital: 'Nalerigu',
    constituencies: [
      {
        name: 'Bunkpurugu',
        districts: [
          { name: 'Bunkpurugu Nakpanduri District' },
        ],
      },
      {
        name: 'Chereponi',
        districts: [
          { name: 'Chereponi District' },
        ],
      },
      {
        name: 'Nalerigu Gambaga',
        districts: [
          { name: 'East Mamprusi Municipal', capital: 'Nalerigu' },
        ],
      },
      {
        name: 'Walewale',
        districts: [
          { name: 'West Mamprusi Municipal' },
        ],
      },
      {
        name: 'Yagaba Kubori',
        districts: [
          { name: 'Mamprugu Moagduri District' },
        ],
      },
      {
        name: 'Yunyoo Nasuan',
        districts: [
          { name: 'Yunyoo Nasuan District' },
        ],
      },
    ],
  },
];

// Helper functions
export function getRegionNames(): string[] {
  return GHANA_REGIONS.map((r) => r.name);
}

export function getConstituenciesByRegion(regionName: string): string[] {
  const region = GHANA_REGIONS.find((r) => r.name === regionName);
  return region ? region.constituencies.map((c) => c.name) : [];
}

export function getDistrictsByConstituency(regionName: string, constituencyName: string): string[] {
  const region = GHANA_REGIONS.find((r) => r.name === regionName);
  if (!region) return [];
  const constituency = region.constituencies.find((c) => c.name === constituencyName);
  return constituency ? constituency.districts.map((d) => d.name) : [];
}

export function getAllDistricts(): string[] {
  const districts = new Set<string>();
  GHANA_REGIONS.forEach((region) => {
    region.constituencies.forEach((constituency) => {
      constituency.districts.forEach((district) => {
        districts.add(district.name);
      });
    });
  });
  return Array.from(districts).sort();
}
