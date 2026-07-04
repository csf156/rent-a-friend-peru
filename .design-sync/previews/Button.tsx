import { View } from 'react-native';
import { Button } from '../../components/Button';

export function Primary() {
  return (
    <View style={{ padding: 16 }}>
      <Button label="Reservar amigo" onPress={() => {}} />
    </View>
  );
}

export function Accent() {
  return (
    <View style={{ padding: 16 }}>
      <Button label="Ver perfil" variant="accent" onPress={() => {}} />
    </View>
  );
}

export function Disabled() {
  return (
    <View style={{ padding: 16 }}>
      <Button label="Reservar amigo" disabled onPress={() => {}} />
    </View>
  );
}
