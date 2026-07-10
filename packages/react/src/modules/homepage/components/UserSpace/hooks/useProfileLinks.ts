import { UserProfile } from '@edifice.io/client';
import { useEdificeClient } from 'src/providers';

/** Generates user's links to show in the UserSpace widget. */
export function useProfileLinks(
  profile: UserProfile[number],
): Array<{ url: string; icon: string }> | undefined {
  const { user } = useEdificeClient();

  // Retrieve structure ID
  const structureId = user?.structures?.[0];

  if (structureId && profile) {
    const baseUrl = '/userbook/annuaire#/search';

    switch (profile) {
      case 'Teacher': {
        let url = `${baseUrl}?filters=groups&structure=${structureId}}`;
        user.classes.forEach((clazz) => (url += '&class=' + clazz));
        return [
          {
            icon: 'teacher1',
            url,
          },
        ];
      }
      case 'Student': {
        let url = `${baseUrl}?filters=groups&structure=${structureId}}`;
        user.classes.forEach((clazz) => (url += '&class=' + clazz));
        return [
          {
            icon: 'Student1',
            url: `/userbook/annuaire#/search?filters=groups&profile=Teacher`,
          },
          {
            icon: 'Student2',
            url,
          },
        ];
      }
      case 'Relative': {
        return [];
      }
      case 'Personnel': {
        return [
          {
            icon: 'Personnel1',
            url: `${baseUrl}?filters=groups&structure=${structureId}}`,
          },
        ];
      }
    }
  }

  return; // For Guests and unconnected users, no link.
}
