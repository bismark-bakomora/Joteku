import { lightColors, makeStyles, radii } from '@/theme';
import { MobileMoneyNetwork } from '@/types/payment';
import { Image, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const SIZE = 40;

// The networks' own marks, each drawn on its brand tile like their app icons.
// MTN's oval is the vector from mtn.com.gh and Telecel's "t" is the vector from
// telecel.com.gh; the colours inside are part of the artwork. AT (formerly
// AirtelTigo) publishes no vector, so its mark is the official PNG.
const MTN_XML = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
<rect width="40" height="40" fill="#FFCB05"/>
<g transform="translate(4 12) scale(0.05645)"><path fill="#1D1D1B" d="M283.46,0C126.91,0,0,63.46,0,141.73S126.91,283.46,283.46,283.46,566.93,220,566.93,141.73,440,0,283.46,0Zm0,261.09c-144.19,0-261.08-53.44-261.08-119.36S139.27,22.38,283.46,22.38,544.55,75.81,544.55,141.73,427.66,261.09,283.46,261.09ZM247.72,116.87V94.49h80v22.38h-28.8V189H276.51V116.87Zm176.5-22.38V189H401.84l-40.59-56.25V189H338.88V94.49h22.37l40.59,56.25V94.49ZM142.05,189V94.49h22.38l24.86,38.24,24.86-38.24h22.38V189H214.15V135.53l-17,26.09H181.4l-17-26.09V189Z"/></g>
</svg>`;

const TELECEL_XML = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
<rect width="40" height="40" fill="#E32527"/>
<g transform="translate(-12.6 6.97) scale(0.807)">
<path fill="#FFFFFF" d="M40.5383 0.000825013C31.5512 -0.0898868 24.3272 7.3122 24.3487 16.103C24.3718 25.4249 32.1928 32.3008 40.3552 32.1507C49.0091 32.2332 56.4062 25.3127 56.4821 16.3075C56.5613 6.87843 49.0949 0.0882382 40.5383 0.000825013Z"/>
<path fill="#E32527" d="M41.091 14.2361C41.0283 14.6732 41.119 15.097 41.1157 15.5291C41.1124 17.2939 41.1157 19.062 41.1124 20.8284C41.1124 21.1219 41.1437 21.4106 41.2048 21.6959C41.4554 22.8224 42.3923 23.4887 43.5385 23.3485C44.4193 23.238 45.3099 23.233 46.1939 23.1572C46.5353 23.1291 46.6607 23.2644 46.659 23.5909C46.6541 24.2688 46.6508 24.9483 46.659 25.6262C46.6739 26.7659 46.1048 27.5823 45.1054 27.9962C42.2702 29.1672 39.4713 29.1425 36.9149 27.2953C35.5097 26.281 34.7576 24.8312 34.6768 23.0417C34.5762 20.7409 34.5366 18.4418 34.4657 16.1377C34.3931 13.8122 34.4146 11.4867 34.4327 9.16118C34.4442 7.60093 35.1683 6.33427 36.3195 5.31005C36.9578 4.73774 37.6703 4.27428 38.4455 3.90154C39.1497 3.56343 39.8837 3.43644 40.6555 3.44798C40.931 3.45293 41.0349 3.55849 41.0646 3.84217C41.1404 4.57776 41.1041 5.31499 41.1173 5.98956C41.1173 6.58661 41.1124 7.12428 41.1173 7.66196C41.1206 8.12871 41.2856 8.29859 41.7589 8.36786C42.0855 8.41899 42.4087 8.37611 42.7353 8.37281C43.8585 8.35796 44.98 8.35796 46.1032 8.36786C46.7646 8.37611 46.9707 8.57897 46.9509 9.2321C46.9311 9.8176 47.0301 10.3949 46.9625 10.9837C46.8107 12.2767 46.0504 13.0387 44.8728 13.4477C44.223 13.6753 43.5435 13.6819 42.8623 13.6819C42.4434 13.6786 42.0212 13.6456 41.6006 13.7133C41.2988 13.7644 41.1338 13.9128 41.091 14.2377V14.2361Z"/>
</g>
</svg>`;

export function NetworkLogo({ network }: { network: MobileMoneyNetwork }) {
  const styles = useStyles();
  return (
    <View style={[styles.tile, network === 'airteltigo' && styles.plainTile]}>
      {network === 'mtn' ? <SvgXml height={SIZE} width={SIZE} xml={MTN_XML} /> : null}
      {network === 'telecel' ? <SvgXml height={SIZE} width={SIZE} xml={TELECEL_XML} /> : null}
      {network === 'airteltigo' ? (
        <Image resizeMode="contain" source={require('../assets/networks/at.png')} style={styles.atMark} />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  tile: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // AT's mark is drawn on white, so its tile stays white in dark mode too.
  plainTile: {
    backgroundColor: lightColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  atMark: {
    width: 28,
    height: 26,
  },
}));
