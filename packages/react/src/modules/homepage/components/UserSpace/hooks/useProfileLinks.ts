import { UserProfile } from '@edifice.io/client';
import { useTranslation } from 'react-i18next';
import { useEdificeClient } from 'src/providers';

/** Generates user's links to show in the UserSpace widget. */
export function useProfileLinks(
  profile: UserProfile[number],
): Array<{ url: string; text: string }> | undefined {
  const { user } = useEdificeClient();
  const { t } = useTranslation();

  // Retrieve structure ID
  const structureId = user?.structures?.[0];

  if (structureId && profile) {
    const baseUrl = '/userbook/annuaire#/search';

    switch (profile) {
      case 'Teacher': {
        let url = `${baseUrl}?filters=groups&structure=${structureId}`;
        user.classes.forEach((clazz) => (url += '&class=' + clazz));
        return [
          {
            text: t('userspace.teacher.link.my-classes'),
            url,
          },
        ];
      }
      case 'Student': {
        let url = `${baseUrl}?filters=groups&structure=${structureId}`;
        user.classes.forEach((clazz) => (url += '&class=' + clazz));
        return [
          {
            text: t('userspace.student.link.my-teachers'),
            url: `/userbook/annuaire#/search?filters=groups&profile=Teacher`,
          },
          {
            text: t('userspace.student.link.my-classes'),
            url,
          },
        ];
      }
      case 'Relative': {
        return [
          /*TODO La classe de <Prénom de son enfant> (autant de fois qu’il a d’enfant) */
        ];
      }
      case 'Personnel': {
        return [
          {
            text: t('userspace.personnel.link.my-structure'),
            url: `${baseUrl}?filters=groups&structure=${structureId}`,
          },
        ];
      }
    }
  }

  return; // For Guests and unconnected users, no link.
}
