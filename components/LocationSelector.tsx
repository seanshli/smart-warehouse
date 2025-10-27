'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from './LanguageProvider'

interface LocationData {
  country: string
  city: string
  district: string
  community: string
  apartmentNo: string
  latitude?: number
  longitude?: number
  address?: string
  streetAddress?: string
  telephone?: string
}

interface LocationSelectorProps {
  value: LocationData
  onChange: (location: LocationData) => void
  disabled?: boolean
}

// Taiwan major cities and districts with translations
const TAIWAN_LOCATIONS = {
  '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
  '桃園市': ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '大園區', '龜山區', '八德區', '龍潭區', '平鎮區', '新屋區', '觀音區', '復興區'],
  '台中市': ['中區', '東區', '南區', '西區', '北區', '西屯區', '南屯區', '北屯區', '豐原區', '東勢區', '大甲區', '清水區', '沙鹿區', '梧棲區', '后里區', '神岡區', '潭子區', '大雅區', '新社區', '石岡區', '外埔區', '大安區', '烏日區', '大肚區', '龍井區', '霧峰區', '太平區', '大里區', '和平區'],
  '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
  '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區', '左營區', '仁武區', '大社區', '東沙群島', '南沙群島', '岡山區', '路竹區', '阿蓮區', '田寮區', '燕巢區', '橋頭區', '梓官區', '彌陀區', '永安區', '湖內區', '鳳山區', '大寮區', '林園區', '鳥松區', '大樹區', '旗山區', '美濃區', '六龜區', '內門區', '杉林區', '甲仙區', '桃源區', '那瑪夏區', '茂林區'],
  '基隆市': ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
  '新竹市': ['東區', '北區', '香山區'],
  '嘉義市': ['東區', '西區'],
  '嘉義縣': ['番路鄉', '梅山鄉', '竹崎鄉', '阿里山鄉', '中埔鄉', '大埔鄉', '水上鄉', '鹿草鄉', '太保市', '朴子市', '東石鄉', '六腳鄉', '新港鄉', '民雄鄉', '大林鎮', '溪口鄉', '義竹鄉', '布袋鎮'],
  '新竹縣': ['竹北市', '湖口鄉', '新豐鄉', '新埔鎮', '關西鎮', '芎林鄉', '寶山鄉', '竹東鎮', '五峰鄉', '橫山鄉', '尖石鄉', '北埔鄉', '峨眉鄉'],
  '苗栗縣': ['竹南鎮', '頭份市', '三灣鄉', '南庄鄉', '獅潭鄉', '後龍鎮', '通霄鎮', '苑裡鎮', '苗栗市', '造橋鄉', '頭屋鄉', '公館鄉', '大湖鄉', '泰安鄉', '銅鑼鄉', '三義鄉', '西湖鄉', '卓蘭鎮'],
  '彰化縣': ['彰化市', '芬園鄉', '花壇鄉', '秀水鄉', '鹿港鎮', '福興鄉', '線西鄉', '和美鎮', '伸港鄉', '員林市', '社頭鄉', '永靖鄉', '埔心鄉', '溪湖鎮', '大村鄉', '埔鹽鄉', '田中鎮', '北斗鎮', '田尾鄉', '埤頭鄉', '溪州鄉', '竹塘鄉', '二林鎮', '大城鄉', '芳苑鄉', '二水鄉'],
  '南投縣': ['南投市', '中寮鄉', '草屯鎮', '國姓鄉', '埔里鎮', '仁愛鄉', '名間鄉', '集集鎮', '水里鄉', '魚池鄉', '信義鄉', '竹山鎮', '鹿谷鄉'],
  '雲林縣': ['斗南鎮', '大埤鄉', '虎尾鎮', '土庫鎮', '褒忠鄉', '東勢鄉', '台西鄉', '崙背鄉', '麥寮鄉', '斗六市', '林內鄉', '古坑鄉', '莿桐鄉', '西螺鎮', '二崙鄉', '北港鎮', '水林鄉', '口湖鄉', '四湖鄉', '元長鄉'],
  '屏東縣': ['屏東市', '三地門鄉', '霧台鄉', '瑪家鄉', '九如鄉', '里港鄉', '高樹鄉', '鹽埔鄉', '長治鄉', '麟洛鄉', '竹田鄉', '內埔鄉', '萬丹鄉', '潮州鎮', '泰武鄉', '來義鄉', '萬巒鄉', '崁頂鄉', '新埤鄉', '南州鄉', '林邊鄉', '東港鎮', '琉球鄉', '佳冬鄉', '新園鄉', '枋寮鄉', '枋山鄉', '春日鄉', '獅子鄉', '車城鄉', '牡丹鄉', '恆春鎮', '滿州鄉'],
  '宜蘭縣': ['宜蘭市', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '羅東鎮', '三星鄉', '大同鄉', '五結鄉', '冬山鄉', '蘇澳鎮', '南澳鄉'],
  '花蓮縣': ['花蓮市', '新城鄉', '秀林鄉', '吉安鄉', '壽豐鄉', '鳳林鎮', '光復鄉', '豐濱鄉', '瑞穗鄉', '玉里鎮', '卓溪鄉', '富里鄉'],
  '台東縣': ['台東市', '綠島鄉', '蘭嶼鄉', '延平鄉', '卑南鄉', '鹿野鄉', '關山鎮', '海端鄉', '池上鄉', '東河鄉', '成功鎮', '長濱鄉', '太麻里鄉', '金峰鄉', '大武鄉', '達仁鄉']
}

// Country translations
const COUNTRY_TRANSLATIONS = {
  'en': {
    'Taiwan': 'Taiwan',
    'USA': 'United States',
    'Japan': 'Japan',
    'Singapore': 'Singapore',
    'Other': 'Other'
  },
  'zh-TW': {
    'Taiwan': '台灣',
    'USA': '美國',
    'Japan': '日本',
    'Singapore': '新加坡',
    'Other': '其他'
  },
  'zh': {
    'Taiwan': '台湾',
    'USA': '美国',
    'Japan': '日本',
    'Singapore': '新加坡',
    'Other': '其他'
  },
  'ja': {
    'Taiwan': '台湾',
    'USA': 'アメリカ',
    'Japan': '日本',
    'Singapore': 'シンガポール',
    'Other': 'その他'
  }
}

export default function LocationSelector({ value, onChange, disabled = false }: LocationSelectorProps) {
  const { t, currentLanguage } = useLanguage()
  const [showMap, setShowMap] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Address parsing function for Traditional Chinese addresses
  const parseTaiwanAddress = (address: string) => {
    if (!address) return {}
    
    const result: Partial<LocationData> = {}
    
    // Extract city (台北市, 新北市, etc.)
    const cityMatch = address.match(/(台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|嘉義市|嘉義縣|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|屏東縣|宜蘭縣|花蓮縣|台東縣)/)
    if (cityMatch) {
      result.city = cityMatch[1]
    }
    
    // Extract district (大安區, 信義區, etc.)
    const districtMatch = address.match(/([^市縣]+區|[^市縣]+鄉|[^市縣]+鎮|[^市縣]+市)/)
    if (districtMatch) {
      result.district = districtMatch[1]
    }
    
    // Extract street address (和平東路一段55巷一弄4號7樓)
    // Look for patterns like: 路名+段+巷+弄+號+樓
    const streetMatch = address.match(/([^市縣區鄉鎮]+(?:路|街|大道|巷|弄|號|樓))/g)
    if (streetMatch) {
      result.streetAddress = streetMatch.join('')
    }
    
    // Extract apartment number (4號7樓, 7F, etc.)
    const apartmentMatch = address.match(/(\d+號\d+樓|\d+[F樓]|\d+號)/)
    if (apartmentMatch) {
      result.apartmentNo = apartmentMatch[1]
    }
    
    return result
  }

  // Build full address from components
  const buildFullAddress = (data: LocationData) => {
    const parts = []
    
    if (data.country && data.country !== 'Taiwan') {
      parts.push(data.country)
    }
    
    if (data.city) {
      parts.push(data.city)
    }
    
    if (data.district) {
      parts.push(data.district)
    }
    
    if (data.community) {
      parts.push(data.community)
    }
    
    if (data.streetAddress) {
      parts.push(data.streetAddress)
    }
    
    if (data.apartmentNo) {
      parts.push(data.apartmentNo)
    }
    
    return parts.join('')
  }

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (showMap && mapRef.current && !map && typeof window !== 'undefined' && window.google) {
        console.log('🗺️ Initializing Google Maps...')
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { 
            lat: value.latitude || 25.0330, 
            lng: value.longitude || 121.5654 
          },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        })

        const markerInstance = new window.google.maps.Marker({
          position: { 
            lat: value.latitude || 25.0330, 
            lng: value.longitude || 121.5654 
          },
          map: mapInstance,
          draggable: true,
        })

        // Update location when marker is dragged
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition()
          if (position) {
            const lat = position.lat()
            const lng = position.lng()
            
            // Use Google Geocoding to get address
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                const result = results[0]
                const addressComponents = result.address_components
                
                // Extract address components
                let country = ''
                let city = ''
                let district = ''
                let streetAddress = ''
                let apartmentNo = ''
                
                addressComponents.forEach((component: any) => {
                  const types = component.types
                  if (types.includes('country')) {
                    country = component.long_name
                  } else if (types.includes('administrative_area_level_1')) {
                    city = component.long_name
                  } else if (types.includes('administrative_area_level_2') || types.includes('sublocality')) {
                    district = component.long_name
                  } else if (types.includes('route')) {
                    streetAddress = component.long_name
                  } else if (types.includes('street_number')) {
                    apartmentNo = component.long_name
                  }
                })
                
                // Parse the full address for Taiwan addresses
                const parsedAddress = parseTaiwanAddress(result.formatted_address)
                
                const newLocation = {
                  ...value,
                  latitude: lat,
                  longitude: lng,
                  address: result.formatted_address,
                  country: country || value.country || 'Taiwan',
                  city: parsedAddress.city || city || value.city,
                  district: parsedAddress.district || district || value.district,
                  streetAddress: parsedAddress.streetAddress || streetAddress || value.streetAddress,
                  apartmentNo: parsedAddress.apartmentNo || apartmentNo || value.apartmentNo
                }
                onChange(newLocation)
              } else {
                // Fallback: just update coordinates
                const newLocation = {
                  ...value,
                  latitude: lat,
                  longitude: lng,
                }
                onChange(newLocation)
              }
            })
          }
        })

        setMap(mapInstance)
        setMarker(markerInstance)
        setIsMapInitialized(true)
        console.log('✅ Google Maps initialized successfully')
      } else if (showMap && !window.google) {
        // Google Maps not loaded, retry after a short delay
        console.log('⏳ Google Maps not loaded yet, retrying in 500ms...')
        setTimeout(() => {
          if (window.google) {
            initializeMap()
          } else {
            console.error('❌ Google Maps failed to load after retry')
            alert('Google Maps is not loaded. Please check your internet connection and try again.')
            setShowMap(false)
          }
        }, 500)
      }
    }

    if (showMap) {
      initializeMap()
    }
  }, [showMap, map, value, onChange])

  const handleLocationChange = (field: keyof LocationData, newValue: string) => {
    const updatedLocation = {
      ...value,
      [field]: newValue
    }

    // Auto-clear dependent fields when parent changes
    if (field === 'country') {
      updatedLocation.city = ''
      updatedLocation.district = ''
      updatedLocation.community = ''
    } else if (field === 'city') {
      updatedLocation.district = ''
      updatedLocation.community = ''
    } else if (field === 'district') {
      updatedLocation.community = ''
    }

    // If full address is being changed, parse it
    if (field === 'address' && newValue) {
      const parsed = parseTaiwanAddress(newValue)
      Object.assign(updatedLocation, parsed)
    }

    // Auto-build full address when individual components change
    if (field !== 'address' && (field === 'city' || field === 'district' || field === 'streetAddress' || field === 'apartmentNo')) {
      updatedLocation.address = buildFullAddress(updatedLocation)
    }

    onChange(updatedLocation)
  }

  const handleMapClick = () => {
    // Check if Google Maps is loaded
    if (typeof window !== 'undefined' && !window.google) {
      console.log('⏳ Google Maps not loaded yet, waiting...')
      // Wait for Google Maps to load
      const checkGoogleMaps = () => {
        if (window.google) {
          console.log('✅ Google Maps loaded, opening map...')
          openMap()
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
    } else {
      openMap()
    }
  }

  const openMap = () => {
    if (value.latitude && value.longitude) {
      setShowMap(true)
    } else {
      // Get current location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              ...value,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            onChange(newLocation)
            setShowMap(true)
          },
          (error) => {
            console.error('Error getting location:', error)
            // Fallback: Show map with default location
            setShowMap(true)
          }
        )
      } else {
        // Fallback: Show map with default location
        setShowMap(true)
      }
    }
  }

  const getCityDistricts = (city: string) => {
    return TAIWAN_LOCATIONS[city as keyof typeof TAIWAN_LOCATIONS] || []
  }

  const getCountryOptions = () => {
    const translations = COUNTRY_TRANSLATIONS[currentLanguage as keyof typeof COUNTRY_TRANSLATIONS] || COUNTRY_TRANSLATIONS['en']
    return Object.entries(translations).map(([key, translatedName]) => ({
      value: key,
      label: translatedName
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('country')}
          </label>
          <select
            value={value.country || ''}
            onChange={(e) => handleLocationChange('country', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">{t('selectCountry')}</option>
            {getCountryOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {String(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* City - only show for Taiwan */}
        {value.country === 'Taiwan' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('city')}
            </label>
            <select
              value={value.city || ''}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('selectCity')}</option>
              {Object.keys(TAIWAN_LOCATIONS).map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}

        {/* District - only show for Taiwan with city selected */}
        {value.country === 'Taiwan' && value.city && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('district')}
            </label>
            <select
              value={value.district || ''}
              onChange={(e) => handleLocationChange('district', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('selectDistrict')}</option>
              {getCityDistricts(value.city).map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        )}

        {/* Community/Neighborhood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('community')}
          </label>
          <input
            type="text"
            value={value.community || ''}
            onChange={(e) => handleLocationChange('community', e.target.value)}
            disabled={disabled}
            placeholder={t('enterCommunity')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Street/Building Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('streetAddress')}
          </label>
          <input
            type="text"
            value={value.streetAddress || ''}
            onChange={(e) => handleLocationChange('streetAddress', e.target.value)}
            disabled={disabled}
            placeholder={t('enterStreetAddress')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Apartment/Building No. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('apartmentNo')}
          </label>
          <input
            type="text"
            value={value.apartmentNo || ''}
            onChange={(e) => handleLocationChange('apartmentNo', e.target.value)}
            disabled={disabled}
            placeholder={t('enterApartmentNo')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Telephone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('telephone')}
          </label>
          <input
            type="tel"
            value={value.telephone || ''}
            onChange={(e) => handleLocationChange('telephone', e.target.value)}
            disabled={disabled}
            placeholder={t('enterTelephone')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Full Address */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('fullAddress')}
          </label>
          <input
            type="text"
            value={value.address || ''}
            onChange={(e) => handleLocationChange('address', e.target.value)}
            disabled={disabled}
            placeholder={t('completeAddress')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('enterFullAddressToAutoParse') || 'Enter full address to automatically parse into components'}
          </p>
        </div>
      </div>

      {/* Map Button */}
      <div>
        <button
          type="button"
          onClick={handleMapClick}
          disabled={disabled}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          📍 {value.latitude && value.longitude ? t('updateLocationOnMap') : t('setLocationOnMap')}
        </button>
        
        {value.latitude && value.longitude && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('coordinates')}: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </div>
        )}
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('selectLocationOnMap')}
              </h3>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            {typeof window !== 'undefined' && window.google ? (
              <div ref={mapRef} className="w-full h-64 sm:h-96 rounded-md"></div>
            ) : (
              <div className="w-full h-64 sm:h-96 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">📍</div>
                  <p className="text-gray-600 dark:text-gray-300">{t('googleMapsNotAvailable')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('enterLocationManually')}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowMap(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => setShowMap(false)}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('saveLocation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}