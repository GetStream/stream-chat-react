// German for the example app — the annotated one of the two languages here. See ./index.ts for
// how these exports are registered, and ./it.ts for the same shape without the commentary.
//
// This is a *complete* dictionary: every key the SDK defines is translated, and the type assertion
// below fails the build if a future SDK release adds one that is missing here. Partial dictionaries
// are equally valid — an unsupplied key renders the English copy that ships inline at its call site,
// never a raw `some.dotted.key` — so start small and grow if you prefer.
//
// The side-effect import is what localizes month and weekday names.
import 'dayjs/locale/de.js';

import type { TranslationCatalog, TranslationDictionary } from 'stream-chat-react';

export const deTranslations = {
  'a11y.accessibleLabel.active.ariaLabel': 'Aktiv',
  'a11y.accessibleLabel.unreadMessage.ariaLabel_one': '{{ count }} ungelesene Nachricht',
  'a11y.accessibleLabel.unreadMessage.ariaLabel_other':
    '{{ count }} ungelesene Nachrichten',
  'a11y.incomingMessageAnnouncements.newMessage.label': 'Neue Nachricht von {{user}}',
  'a11y.interactionAnnouncements.commandActivated.ariaLabel':
    'Befehl aktiviert: {{ command }}',
  'a11y.interactionAnnouncements.droppedPosition.ariaLabel':
    '„{{ option }}“ an Position {{ position }} abgelegt.',
  'a11y.interactionAnnouncements.giphyCanceled.ariaLabel': 'Giphy abgebrochen',
  'a11y.interactionAnnouncements.giphyImageChanged.ariaLabel': 'Giphy-Bild geändert',
  'a11y.interactionAnnouncements.giphyImageChanged.withTitle.ariaLabel':
    'Giphy-Bild geändert: {{ title }}',
  'a11y.interactionAnnouncements.giphySent.ariaLabel': 'Giphy gesendet',
  'a11y.interactionAnnouncements.noSearchResultsFound.ariaLabel':
    'Keine Suchergebnisse gefunden',
  'a11y.interactionAnnouncements.openedChannel.ariaLabel': 'Kanal geöffnet: {{ name }}',
  'a11y.interactionAnnouncements.openedThread.ariaLabel': 'Thread in {{ name }} geöffnet',
  'a11y.interactionAnnouncements.pickedUpUseArrow.ariaLabel':
    '„{{ option }}“ aufgenommen. Mit den Pfeiltasten neu anordnen. Leertaste oder Tab zum Ablegen.',
  'a11y.interactionAnnouncements.pollDialogOpened.ariaLabel': 'Umfragedialog geöffnet',
  'a11y.interactionAnnouncements.pollSent.ariaLabel': 'Umfrage gesendet',
  'a11y.interactionAnnouncements.pressEnterStartTyping.ariaLabel':
    'Eingabetaste drücken, um zu schreiben',
  'a11y.interactionAnnouncements.recordingPaused.ariaLabel': 'Aufnahme pausiert',
  'a11y.interactionAnnouncements.recordingResumed.ariaLabel': 'Aufnahme fortgesetzt',
  'a11y.interactionAnnouncements.recordingStarted.ariaLabel': 'Aufnahme gestartet',
  'a11y.interactionAnnouncements.removedOption.ariaLabel': 'Option {{ option }} entfernt',
  'a11y.interactionAnnouncements.searchCleared.ariaLabel': 'Suche geleert',
  'a11y.interactionAnnouncements.searchResults.ariaLabel_one': '{{ count }} Suchergebnis',
  'a11y.interactionAnnouncements.searchResults.ariaLabel_other':
    '{{ count }} Suchergebnisse',
  'a11y.interactionAnnouncements.suggestions.ariaLabel_one': '{{ count }} Vorschlag',
  'a11y.interactionAnnouncements.suggestions.ariaLabel_other': '{{ count }} Vorschläge',
  'a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel_one':
    '{{ count }} {{ suggestionsLabel }}',
  'a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel_other':
    '{{ count }} {{ suggestionsLabel }}',
  'a11y.interactionAnnouncements.userSelected.ariaLabel':
    'Benutzer ausgewählt: {{ user }}',
  'a11y.interactionAnnouncements.voiceMessageSent.ariaLabel': 'Sprachnachricht gesendet',
  'a11y.interactionAnnouncements.voiceRecordingAttached.ariaLabel':
    'Sprachaufnahme angehängt',
  'aiState.indicator.generating.label': 'Wird erstellt...',
  'aiState.indicator.thinking.label': 'Denkt nach...',
  'attachment.actions.giphyActions.ariaLabel': 'Giphy-Aktionen',
  'attachment.actions.giphyPreviewOnlyVisible.ariaLabel':
    'Giphy-Vorschau, nur für dich sichtbar. Nutze die Aktionen Senden, Mischen oder Abbrechen.',
  'attachment.actions.shuffle.label': 'Mischen',
  'attachment.geolocation.liveUntil.text': 'Live bis {{ timestamp }}',
  'attachment.geolocation.locationSharingEnded.text': 'Standortfreigabe beendet',
  'attachment.geolocation.openLocationMap.ariaLabel': 'Standort auf einer Karte öffnen',
  'attachment.geolocation.stopSharing.text': 'Freigabe beenden',
  'attachment.giphy.animatedGif.ariaLabel': 'Animiertes GIF',
  'attachment.giphy.animatedGif.withTitle.ariaLabel': 'Animiertes GIF: {{ title }}',
  'attachment.modalGallery.openGalleryImage.label': 'Galerie bei Bild {{ index }} öffnen',
  'attachment.modalGallery.openImageGallery.label': 'Bild in der Galerie öffnen',
  'attachment.unableRenderCard.text': 'dieser Inhalt konnte nicht angezeigt werden',
  'attachment.visibilityDisclaimer.onlyVisible.text': 'Nur für dich sichtbar',
  'audioPlayback.audioPlayerNotifications.cannotSeekRecording.label':
    'In der Aufnahme kann nicht gesucht werden',
  'audioPlayback.audioPlayerNotifications.failedPlayRecording.label':
    'Aufnahme konnte nicht abgespielt werden',
  'audioPlayback.audioPlayerNotifications.recordingFormatNotSupported.label':
    'Das Aufnahmeformat wird nicht unterstützt und kann nicht abgespielt werden',
  'audioPlayback.progressBar.seekAudioPosition.ariaLabel': 'Audioposition suchen',
  'audioPlayback.progressBarA11y.audioPosition.ariaLabel':
    'Audioposition {{ elapsed }} von {{ duration }}',
  'audioPlayback.progressBarA11y.audioPositionPercent.ariaLabel':
    'Audioposition {{ progress }} Prozent',
  'baseImage.imagePlaceholder.imageFailedLoad.ariaLabel':
    'Bild konnte nicht geladen werden',
  'channel.channelMissing.text': 'Kanal fehlt',
  'channelDetail.avatarChannelDetail.channelDetails.ariaLabel': 'Kanaldetails',
  'channelDetail.avatarChannelDetail.openChannelDetails.ariaLabel': 'Kanaldetails öffnen',
  'channelDetail.channelFilesEmpty.noFiles.text': 'Keine Dateien',
  'channelDetail.channelFilesEmpty.shareFileSee.text':
    'Teile eine Datei, um sie hier zu sehen',
  'channelDetail.channelFilesView.files.title': 'Dateien',
  'channelDetail.channelManagementActions.blockUser.title': 'Benutzer blockieren',
  'channelDetail.channelManagementActions.chatDeleted.text': 'Chat gelöscht',
  'channelDetail.channelManagementActions.deleteChat.title': 'Chat löschen',
  'channelDetail.channelManagementActions.errorBlockingUser.text':
    'Fehler beim Blockieren des Benutzers',
  'channelDetail.channelManagementActions.errorDeletingChat.text':
    'Fehler beim Löschen des Chats',
  'channelDetail.channelManagementActions.errorMutingChannel.text':
    'Fehler beim Stummschalten des Kanals',
  'channelDetail.channelManagementActions.errorMutingUser.text':
    'Fehler beim Stummschalten des Benutzers',
  'channelDetail.channelManagementActions.errorUnblockingUser.text':
    'Fehler beim Aufheben der Blockierung',
  'channelDetail.channelManagementActions.errorUnmutingChannel.text':
    'Fehler beim Aufheben der Stummschaltung des Kanals',
  'channelDetail.channelManagementActions.errorUnmutingUser.text':
    'Fehler beim Aufheben der Stummschaltung des Benutzers',
  'channelDetail.channelManagementActions.leaveChat.title': 'Chat verlassen',
  'channelDetail.channelManagementActions.muteChat.title': 'Chat stummschalten',
  'channelDetail.channelManagementActions.muteUser.title': 'Benutzer stummschalten',
  'channelDetail.channelManagementActions.permanentlyDeletesMessageHistory.description':
    'Dies löscht deinen Nachrichtenverlauf mit {{ user }} endgültig. Das kann nicht rückgängig gemacht werden.',
  'channelDetail.channelManagementActions.sureWantLeaveChannel.description':
    'Möchtest du diesen Kanal wirklich verlassen?',
  'channelDetail.channelManagementActions.unmuteChat.title':
    'Stummschaltung des Chats aufheben',
  'channelDetail.channelManagementActions.unmuteUser.title':
    'Stummschaltung des Benutzers aufheben',
  'channelDetail.channelManagementActions.userAbleMessageAgain.description':
    'Dieser Benutzer kann dir wieder schreiben.',
  'channelDetail.channelManagementActions.userMuted.text': 'Benutzer stummgeschaltet',
  'channelDetail.channelManagementActions.userUnmuted.text':
    'Stummschaltung des Benutzers aufgehoben',
  'channelDetail.channelManagementActions.userWonTAble.description':
    'Dieser Benutzer kann dir nicht mehr schreiben. Du kannst die Blockierung jederzeit aufheben.',
  'channelDetail.channelManagementView.changesSaved.text': 'Änderungen gespeichert',
  'channelDetail.channelManagementView.contactInfo.label': 'Kontaktinfo',
  'channelDetail.channelManagementView.contactName.label': 'Kontaktname',
  'channelDetail.channelManagementView.edit.text': 'Bearbeiten',
  'channelDetail.channelManagementView.editChatData.ariaLabel': 'Chatdaten bearbeiten',
  'channelDetail.channelManagementView.editContact.label': 'Kontakt bearbeiten',
  'channelDetail.channelManagementView.editGroup.label': 'Gruppe bearbeiten',
  'channelDetail.channelManagementView.failedSaveChanges.text':
    'Änderungen konnten nicht gespeichert werden',
  'channelDetail.channelManagementView.groupInfo.label': 'Gruppeninfo',
  'channelDetail.channelManagementView.groupName.label': 'Gruppenname',
  'channelDetail.channelManagementView.manageChannel.description': 'Kanal verwalten',
  'channelDetail.channelManagementView.save.text': 'Speichern',
  'channelDetail.channelManagementView.uploadPicture.text': 'Bild hochladen',
  'channelDetail.channelMediaEmpty.noPhotosVideos.text': 'Keine Fotos oder Videos',
  'channelDetail.channelMediaEmpty.sharePhotoVideoSee.text':
    'Teile ein Foto oder Video, um es hier zu sehen',
  'channelDetail.channelMediaView.next.text': 'Weiter',
  'channelDetail.channelMediaView.nextPage.ariaLabel': 'Nächste Seite',
  'channelDetail.channelMediaView.openImageShared.ariaLabel':
    'Von {{ name }} geteiltes Bild öffnen',
  'channelDetail.channelMediaView.openVideoShared.ariaLabel':
    'Von {{ name }} geteiltes Video öffnen',
  'channelDetail.channelMediaView.photosVideos.title': 'Fotos & Videos',
  'channelDetail.channelMediaView.previous.text': 'Zurück',
  'channelDetail.channelMediaView.previousPage.ariaLabel': 'Vorherige Seite',
  'channelDetail.channelMemberActions.ableMessageAgain.description':
    '{{ member }} kann dir wieder schreiben.',
  'channelDetail.channelMemberActions.errorOpeningDirectMessage.text':
    'Fehler beim Öffnen der Direktnachricht',
  'channelDetail.channelMemberActions.errorRemovingUser.text':
    'Fehler beim Entfernen des Benutzers',
  'channelDetail.channelMemberActions.removeChannel.description':
    '{{ member }} aus diesem Kanal entfernen?',
  'channelDetail.channelMemberActions.removeUser.title': 'Benutzer entfernen',
  'channelDetail.channelMemberActions.sendDirectMessage.title': 'Direktnachricht senden',
  'channelDetail.channelMemberActions.unblockUser.title': 'Blockierung aufheben',
  'channelDetail.channelMemberActions.userRemoved.text': 'Benutzer entfernt',
  'channelDetail.channelMemberActions.wonTAbleMessage.description':
    '{{ member }} kann dir nicht mehr schreiben.',
  'channelDetail.channelMemberDetail.lastSeen.label': 'Zuletzt gesehen {{ timestamp }}',
  'channelDetail.channelMemberDetail.memberDetail.title': 'Mitgliedsdetails',
  'channelDetail.channelMembersAdd.addMembers.text_one':
    '{{ count }} Mitglied hinzufügen',
  'channelDetail.channelMembersAdd.addMembers.text_other':
    '{{ count }} Mitglieder hinzufügen',
  'channelDetail.channelMembersAdd.alreadyMember.label': 'Bereits Mitglied',
  'channelDetail.channelMembersAdd.errorAddingMembers.text':
    'Fehler beim Hinzufügen von Mitgliedern',
  'channelDetail.channelMembersAdd.membersAdded.text_one':
    '{{ count }} Mitglied hinzugefügt',
  'channelDetail.channelMembersAdd.membersAdded.text_other':
    '{{ count }} Mitglieder hinzugefügt',
  'channelDetail.channelMembersAdd.noUserFound.text': 'Kein Benutzer gefunden',
  'channelDetail.channelMembersBrowse.admin.label': 'Administrator',
  'channelDetail.channelMembersBrowse.moderator.label': 'Moderator',
  'channelDetail.channelMembersBrowse.noMemberFound.text': 'Kein Mitglied gefunden',
  'channelDetail.channelMembersBrowse.owner.label': 'Eigentümer',
  'channelDetail.channelMembersBrowse.viewMemberDetails.ariaLabel':
    'Mitgliedsdetails für {{ member }} ansehen',
  'channelDetail.channelMembersHeader.actions.text': 'Aktionen',
  'channelDetail.channelMembersHeader.add.text': 'Hinzufügen',
  'channelDetail.channelMembersHeader.addChannelMembers.ariaLabel':
    'Kanalmitglieder hinzufügen',
  'channelDetail.channelMembersHeader.openMembersActions.ariaLabel':
    'Mitgliederaktionen öffnen',
  'channelDetail.channelMembersView.addMembers.label': 'Mitglieder hinzufügen',
  'channelDetail.channelMembersView.browseChannelMembers.description':
    'Kanalmitglieder durchsuchen',
  'channelDetail.channelMembersView.members.title_one': '{{ count }} Mitglied',
  'channelDetail.channelMembersView.members.title_other': '{{ count }} Mitglieder',
  'channelDetail.pinnedMessagesEmpty.noPinnedMessages.text':
    'Keine angepinnten Nachrichten',
  'channelDetail.pinnedMessagesEmpty.pinMessageSee.text':
    'Pinne eine Nachricht an, um sie hier zu sehen',
  'channelDetail.pinnedMessagesView.browsePinnedMessages.description':
    'Angepinnte Nachrichten durchsuchen',
  'channelDetail.pinnedMessagesView.noMessagesFound.text': 'Keine Nachrichten gefunden',
  'channelDetail.pinnedMessagesView.pinnedMessage.label': 'Angepinnte Nachricht',
  'channelDetail.pinnedMessagesView.pinnedMessages.title': 'Angepinnte Nachrichten',
  'channelDetail.sectionNavigatorHeader.openMenu.ariaLabel': 'Menü öffnen',
  'channelHeader.online.members.label': '{{ memberCount }} Mitglieder',
  'channelHeader.online.online.label': '{{ watcherCount }} online',
  'channelList.channelList.ariaLabel': 'Kanalliste',
  'channelList.header.chats.text': 'Chats',
  'channelListItem.archive.title': 'Archivieren',
  'channelListItem.attachment.ariaLabel': 'Anhang',
  'channelListItem.attachment.text': '🏙 Anhang...',
  'channelListItem.attachment.withAttachmentType.ariaLabel':
    'Anhang {{ attachmentType }}',
  'channelListItem.attachmentCount.ariaLabel_one': '{{ count }} Anhang',
  'channelListItem.attachmentCount.ariaLabel_other': '{{ count }} Anhänge',
  'channelListItem.audio.ariaLabel': 'Audio',
  'channelListItem.channelActions.ariaLabel': 'Kanalaktionen',
  'channelListItem.channelArchived.text': 'Kanal archiviert',
  'channelListItem.channelDisplayName.directMessage.label': 'Direktnachricht',
  'channelListItem.channelPinned.text': 'Kanal angepinnt',
  'channelListItem.channelUnarchived.text': 'Kanal aus dem Archiv geholt',
  'channelListItem.channelUnpinned.text': 'Kanal losgelöst',
  'channelListItem.created.text': '📊 {{createdBy}} hat erstellt: {{ pollName}}',
  'channelListItem.delivered.ariaLabel': 'Zugestellt',
  'channelListItem.deliveryStatus.ariaLabel': 'Zustellstatus: {{ deliveryStatus }}',
  'channelListItem.failedBlockUser.text': 'Benutzer konnte nicht blockiert werden',
  'channelListItem.failedUpdateChannelArchive.text':
    'Archivstatus des Kanals konnte nicht aktualisiert werden',
  'channelListItem.failedUpdateChannelMute.text':
    'Stummschaltung des Kanals konnte nicht aktualisiert werden',
  'channelListItem.failedUpdateChannelPinned.text':
    'Pinn-Status des Kanals konnte nicht aktualisiert werden',
  'channelListItem.file.ariaLabel': 'Datei',
  'channelListItem.gif.ariaLabel': 'GIF',
  'channelListItem.image.ariaLabel': 'Bild',
  'channelListItem.lastMessage.withMessagePreview.ariaLabel':
    'Letzte Nachricht: {{ messagePreview }}',
  'channelListItem.lastMessage.withSenderAndMessagePreview.ariaLabel':
    'Letzte Nachricht von {{ sender }}: {{ messagePreview }}',
  'channelListItem.leaveChannel.title': 'Kanal verlassen',
  'channelListItem.messageAttachments.ariaLabel': 'Nachricht mit Anhängen',
  'channelListItem.noMessagesChat.ariaLabel': 'In diesem Chat gibt es keine Nachrichten.',
  'channelListItem.openChannelActionsMenu.ariaLabel': 'Menü mit Kanalaktionen öffnen',
  'channelListItem.poll.ariaLabel': 'Umfrage: {{ pollName }}',
  'channelListItem.read.ariaLabel': 'Gelesen',
  'channelListItem.sent.ariaLabel': 'Gesendet',
  'channelListItem.sharedLink.ariaLabel': 'Hat einen Link geteilt',
  'channelListItem.sharedLinkTitle.ariaLabel':
    'Hat einen Link geteilt mit dem Titel: {{ linkTitle }}',
  'channelListItem.sharedLocation.ariaLabel': 'Standort geteilt',
  'channelListItem.sharedLocation.text': '📍Standort geteilt',
  'channelListItem.unarchive.title': 'Aus Archiv holen',
  'channelListItem.unblockUser.title': 'Blockierung aufheben',
  'channelListItem.video.ariaLabel': 'Video',
  'channelListItem.voiceMessage.ariaLabel': 'Sprachnachricht',
  'channelListItem.voted.text': '📊 {{votedBy}} hat abgestimmt: {{pollOptionText}}',
  'chat.reportLostConnection.waitingNetwork.text': 'Warte auf Netzwerk…',
  'command.ban.args': '[@benutzername] [text]',
  'command.ban.description': 'Einen Benutzer sperren',
  'command.giphy.args': '[text]',
  'command.giphy.description': 'Ein zufälliges GIF im Kanal posten',
  'command.mute.args': '[@benutzername]',
  'command.mute.description': 'Einen Benutzer stummschalten',
  'command.unban.args': '[@benutzername]',
  'command.unban.description': 'Sperre eines Benutzers aufheben',
  'command.unmute.args': '[@benutzername]',
  'command.unmute.description': 'Stummschaltung eines Benutzers aufheben',
  'common.addReaction.text': 'Reaktion hinzufügen',
  'common.anonymous.label': 'Anonym',
  'common.back.label': 'Zurück',
  'common.blockUser.title': 'Benutzer blockieren',
  'common.cancel.label': 'Abbrechen',
  'common.channelMuted.text': 'Kanal stummgeschaltet',
  'common.channelUnmuted.text': 'Kanal nicht mehr stummgeschaltet',
  'common.close.ariaLabel': 'Schließen',
  'common.createQuestionAddOptions.label':
    'Frage erstellen, Optionen hinzufügen und Umfrageeinstellungen festlegen',
  'common.currentLocation.text': 'Aktueller Standort',
  'common.delete.text': 'Löschen',
  'common.downloadAttachment.ariaLabel': 'Anhang herunterladen',
  'common.downloadAttachment.title': 'Anhang herunterladen',
  'common.editMessage.text': 'Nachricht bearbeiten',
  'common.emptyMessage.text': 'Leere Nachricht...',
  'common.errorDeletingMessage.label': 'Fehler beim Löschen der Nachricht',
  'common.errorMutingUser.label': 'Fehler beim Stummschalten eines Benutzers ...',
  'common.errorPinningMessage.label': 'Fehler beim Anpinnen der Nachricht',
  'common.errorRemovingMessagePin.label': 'Fehler beim Entfernen der Pinnnadel',
  'common.errorUnmutingUser.label': 'Fehler beim Aufheben der Stummschaltung ...',
  'common.failedLeaveChannel.text': 'Kanal konnte nicht verlassen werden',
  'common.lastActivity.ariaLabel': 'Letzte Aktivität: {{ time }}',
  'common.leftChannel.text': 'Kanal verlassen',
  'common.liveLocation.text': 'Live-Standort',
  'common.location.text': 'Standort',
  'common.messageDeleted.text': 'Nachricht gelöscht',
  'common.messagePinned.label': 'Nachricht angepinnt',
  'common.mute.title': 'Stummschalten',
  'common.muted.label': '{{ user }} wurde stummgeschaltet',
  'common.newMessages.label_one': '{{count}} neue Nachricht',
  'common.newMessages.label_other': '{{count}} neue Nachrichten',
  'common.nothingYet.text': 'Noch nichts...',
  'common.offline.label': 'Offline',
  'common.online.label': 'Online',
  'common.openReactionSelector.ariaLabel': 'Reaktionsauswahl öffnen',
  'common.pause.ariaLabel': 'Pause',
  'common.pin.title': 'Anpinnen',
  'common.play.ariaLabel': 'Abspielen',
  'common.playbackSpeedX.label': 'Wiedergabegeschwindigkeit {{ rate }}x',
  'common.poll.label': 'Umfrage',
  'common.reminderSet.text': 'Erinnerung gesetzt',
  'common.replyCount.label_one': '1 Antwort',
  'common.replyCount.label_other': '{{ count }} Antworten',
  'common.resultsLoaded.label': 'Alle Ergebnisse geladen',
  'common.retryUpload.ariaLabel': 'Upload wiederholen',
  'common.savedLater.text': 'Für später gespeichert',
  'common.search.ariaLabel': 'Suchen',
  'common.send.label': 'Senden',
  'common.threads.text': 'Threads',
  'common.unblock.ariaLabel': 'Blockierung aufheben',
  'common.unmute.title': 'Stummschaltung aufheben',
  'common.unmuted.label': 'Die Stummschaltung von {{ user }} wurde aufgehoben',
  'common.unpin.title': 'Loslösen',
  'common.unsupportedAttachment.text': 'Nicht unterstützter Anhang',
  'common.userBlocked.text': 'Benutzer blockiert',
  'common.userUnblocked.text': 'Blockierung des Benutzers aufgehoben',
  'common.userUploadedContent.label': 'Von Benutzern hochgeladene Inhalte',
  'common.voiceMessage.label': 'Sprachnachricht',
  'common.you.label': 'Du',
  'dialog.callout.closeCalloutDialog.ariaLabel': 'Hinweisdialog schließen',
  'dialog.contextMenu.backParentMenuButton.ariaLabel': 'Zurück zum übergeordneten Menü',
  'dialog.contextMenu.submenu.ariaLabel': 'Untermenü',
  'dialog.prompt.goBack.ariaLabel': 'Zurück',
  'dialog.viewer.closeDialog.ariaLabel': 'Dialog schließen',
  'emojiPicker.emojiPicker.ariaLabel': 'Emoji-Auswahl',
  'emptyState.indicator.noConversationsYet.label': 'Noch keine Unterhaltungen',
  'emptyState.indicator.noItemsExist.text': 'Keine Einträge vorhanden',
  'emptyState.indicator.startConversation.label':
    'Schreibe eine Nachricht, um die Unterhaltung zu beginnen',
  'fileUpload.uploadButton.fileUpload.ariaLabel': 'Datei-Upload',
  'form.numericInput.decreaseValue.ariaLabel': 'Wert verringern',
  'form.numericInput.increaseValue.ariaLabel': 'Wert erhöhen',
  'form.switchField.disabled.ariaLabel': '{{ setting }} deaktiviert',
  'form.switchField.enabled.ariaLabel': '{{ setting }} aktiviert',
  'gallery.ui.nextImage.ariaLabel': 'Nächstes Bild',
  'gallery.ui.previousImage.ariaLabel': 'Vorheriges Bild',
  'language.af': 'Afrikaans',
  'language.am': 'Amharisch',
  'language.ar': 'Arabisch',
  'language.az': 'Aserbaidschanisch',
  'language.bg': 'Bulgarisch',
  'language.bn': 'Bengalisch',
  'language.bs': 'Bosnisch',
  'language.cs': 'Tschechisch',
  'language.da': 'Dänisch',
  'language.de': 'Deutsch',
  'language.el': 'Griechisch',
  'language.en': 'Englisch',
  'language.es': 'Spanisch',
  'language.es-MX': 'Spanisch (Mexiko)',
  'language.et': 'Estnisch',
  'language.fa': 'Persisch',
  'language.fa-AF': 'Dari',
  'language.fi': 'Finnisch',
  'language.fr': 'Französisch',
  'language.fr-CA': 'Französisch (Kanada)',
  'language.ha': 'Hausa',
  'language.he': 'Hebräisch',
  'language.hi': 'Hindi',
  'language.hr': 'Kroatisch',
  'language.ht': 'Haitianisch',
  'language.hu': 'Ungarisch',
  'language.id': 'Indonesisch',
  'language.it': 'Italienisch',
  'language.ja': 'Japanisch',
  'language.ka': 'Georgisch',
  'language.ko': 'Koreanisch',
  'language.lt': 'Litauisch',
  'language.lv': 'Lettisch',
  'language.ms': 'Malaiisch',
  'language.nl': 'Niederländisch',
  'language.no': 'Norwegisch',
  'language.pl': 'Polnisch',
  'language.ps': 'Paschtu',
  'language.pt': 'Portugiesisch',
  'language.ro': 'Rumänisch',
  'language.ru': 'Russisch',
  'language.sk': 'Slowakisch',
  'language.sl': 'Slowenisch',
  'language.so': 'Somali',
  'language.sq': 'Albanisch',
  'language.sr': 'Serbisch',
  'language.sv': 'Schwedisch',
  'language.sw': 'Swahili',
  'language.ta': 'Tamil',
  'language.th': 'Thai',
  'language.tl': 'Tagalog',
  'language.tr': 'Türkisch',
  'language.uk': 'Ukrainisch',
  'language.ur': 'Urdu',
  'language.vi': 'Vietnamesisch',
  'language.zh': 'Chinesisch (vereinfacht)',
  'language.zh-TW': 'Chinesisch (traditionell)',
  'loadMore.button.loadMore.label': 'Mehr laden',
  'loading.errorIndicator.error.text': 'Fehler: {{ errorMessage }}',
  'loading.progressIndicators.percentComplete.ariaLabel':
    '{{percent}} Prozent abgeschlossen',
  'location.shareLocationDialog.attach.text': 'Anhängen',
  'location.shareLocationDialog.description':
    'Wähle deinen aktuellen Standort und aktiviere optional die Live-Standortfreigabe',
  'location.shareLocationDialog.share.text': 'Teilen',
  'location.shareLocationDialog.shareLiveLocation.title': 'Live-Standort teilen für',
  'location.shareLocationDialog.shareLocation.title': 'Standort teilen',
  'mediaRecorder.audioRecorderRecording.cancelRecording.ariaLabel': 'Aufnahme abbrechen',
  'mediaRecorder.audioRecorderRecording.completeRecording.ariaLabel':
    'Aufnahme abschließen',
  'mediaRecorder.audioRecorderRecording.pauseRecording.ariaLabel': 'Aufnahme pausieren',
  'mediaRecorder.audioRecorderRecording.resumeRecording.ariaLabel': 'Aufnahme fortsetzen',
  'mediaRecorder.audioRecorderRecording.voiceMessageDeleted.text':
    'Sprachnachricht gelöscht',
  'mediaRecorder.audioRecordingButton.startRecordingAudio.ariaLabel':
    'Audioaufnahme starten',
  'mediaRecorder.error.processing':
    'Bei der Verarbeitung der Aufnahme ist ein Fehler aufgetreten',
  'mediaRecorder.error.recording': 'Bei der Aufnahme ist ein Fehler aufgetreten',
  'mediaRecorder.error.start': 'Fehler beim Starten der Aufnahme',
  'mediaRecorder.permissionDenied.camera.body':
    'Erlaube den Kamerazugriff in deinem Browser, um die Aufnahme zu starten',
  'mediaRecorder.permissionDenied.camera.heading': 'Zugriff auf die Kamera erlauben',
  'mediaRecorder.permissionDenied.microphone.body':
    'Erlaube den Mikrofonzugriff in deinem Browser, um die Aufnahme zu starten',
  'mediaRecorder.permissionDenied.microphone.heading':
    'Zugriff auf das Mikrofon erlauben',
  'mention.channel.description': 'Alle in diesem Kanal benachrichtigen',
  'mention.here.description': 'Alle online Mitglieder in diesem Kanal benachrichtigen',
  'message.alsoSent.alsoSentChannel.text': 'Auch im Kanal gesendet',
  'message.alsoSent.repliedThread.text': 'Hat auf einen Thread geantwortet',
  'message.alsoSent.view.text': 'Ansehen',
  'message.and.withCommaSeparatedUsersAndLastUser.label':
    '{{ commaSeparatedUsers }} und {{ lastUser }}',
  'message.and.withFirstUserAndSecondUser.label': '{{ firstUser }} und {{ secondUser }}',
  'message.blocked.text': 'Die Nachricht wurde durch Moderationsrichtlinien blockiert',
  'message.editedIndicator.edited.text': 'Bearbeitet',
  'message.more.label': '{{ commaSeparatedUsers }} und {{ moreCount }} weitere',
  'message.pinIndicator.pinned.label': 'Von dir angepinnt',
  'message.pinIndicator.pinned.withName.label': 'Von {{ name }} angepinnt',
  'message.reminderNotification.due.label': 'Fällig {{ timeLeft }}',
  'message.reminderNotification.dueSince.label': 'Fällig seit {{ dueSince }}',
  'message.status.delivered.text': 'Zugestellt',
  'message.status.sending.text': 'Wird gesendet...',
  'message.status.sent.text': 'Gesendet',
  'message.text.message.ariaLabel': 'Nachricht,',
  'message.text.message.withUser.ariaLabel': 'Nachricht von {{ user }},',
  'message.translationIndicator.original.text': 'Original',
  'message.translationIndicator.translated.text': 'Übersetzt',
  'message.translationIndicator.translated.withLanguage.text':
    'Übersetzt aus {{ language }}',
  'message.translationIndicator.viewOriginal.text': 'Original ansehen',
  'message.translationIndicator.viewTranslation.text': 'Übersetzung ansehen',
  'message.ui.reviewBouncedMessage.ariaLabel': 'Abgelehnte Nachricht prüfen',
  'messageActions.blockUser.ariaLabel': 'Benutzer blockieren',
  'messageActions.bookmarkMessage.ariaLabel': 'Nachricht merken',
  'messageActions.copyMessage.text': 'Nachricht kopieren',
  'messageActions.copyMessageText.ariaLabel': 'Nachrichtentext kopieren',
  'messageActions.deleteMessage.ariaLabel': 'Nachricht löschen',
  'messageActions.deleteMessageAlert.deleteMessage.title': 'Nachricht löschen',
  'messageActions.deleteMessageAlert.description':
    'Möchtest du diese Nachricht wirklich löschen?',
  'messageActions.downloadSubmenu.download.label': '{{ fileName }} herunterladen',
  'messageActions.downloadSubmenu.download.text': 'Alle herunterladen',
  'messageActions.downloadSubmenu.downloadAttachment.label':
    'Anhang {{ number }} herunterladen',
  'messageActions.editMessage.ariaLabel': 'Nachricht bearbeiten',
  'messageActions.errorAddingFlag.text': 'Fehler beim Melden',
  'messageActions.errorMarkingMessageUnread.text':
    'Fehler beim Markieren als ungelesen. Nachrichten, die älter als die neuesten 100 Kanalnachrichten sind, können nicht als ungelesen markiert werden.',
  'messageActions.flag.text': 'Melden',
  'messageActions.flagMessage.ariaLabel': 'Nachricht melden',
  'messageActions.markMessageUnread.ariaLabel': 'Nachricht als ungelesen markieren',
  'messageActions.markUnread.text': 'Als ungelesen markieren',
  'messageActions.messageActions.ariaLabel': 'Nachrichtenaktionen',
  'messageActions.messageMarkedUnread.text': 'Nachricht als ungelesen markiert',
  'messageActions.messageSuccessfullyFlagged.text':
    'Die Nachricht wurde erfolgreich gemeldet',
  'messageActions.messageUnpinned.text': 'Nachricht losgelöst',
  'messageActions.muteUser.ariaLabel': 'Benutzer stummschalten',
  'messageActions.openMessageActionsMenu.ariaLabel':
    'Menü mit Nachrichtenaktionen öffnen',
  'messageActions.openThread.ariaLabel': 'Thread öffnen',
  'messageActions.pinMessage.ariaLabel': 'Nachricht anpinnen',
  'messageActions.quoteMessage.ariaLabel': 'Nachricht zitieren',
  'messageActions.quoteReply.text': 'Zitiert antworten',
  'messageActions.remindMe.text': 'Erinnere mich',
  'messageActions.remindMeMessage.ariaLabel': 'An Nachricht erinnern',
  'messageActions.remindMeSubmenu.remindMe.text': 'Erinnere mich',
  'messageActions.removeReminder.ariaLabel': 'Erinnerung entfernen',
  'messageActions.removeReminder.text': 'Erinnerung entfernen',
  'messageActions.removeSaveLater.ariaLabel': 'Aus „Für später gespeichert“ entfernen',
  'messageActions.removeSaveLater.text': 'Aus „Für später gespeichert“ entfernen',
  'messageActions.resend.text': 'Erneut senden',
  'messageActions.resendMessage.ariaLabel': 'Nachricht erneut senden',
  'messageActions.saveLater.text': 'Für später speichern',
  'messageActions.threadReply.text': 'Im Thread antworten',
  'messageActions.unmuteUser.ariaLabel': 'Stummschaltung des Benutzers aufheben',
  'messageActions.unpinMessage.ariaLabel': 'Nachricht loslösen',
  'messageBounce.prompt.description':
    'Prüfe diese Nachricht und entscheide, ob du sie löschen, bearbeiten oder trotzdem senden möchtest',
  'messageBounce.prompt.sendAnyway.text': 'Trotzdem senden',
  'messageBounce.prompt.title':
    'Diese Nachricht entspricht nicht unseren Inhaltsrichtlinien',
  'messageComposer.attachmentPreviewRoot.showPreview.ariaLabel': 'Vorschau anzeigen',
  'messageComposer.attachmentSelector.attachmentActions.ariaLabel': 'Anhangsaktionen',
  'messageComposer.attachmentSelector.commands.text': 'Befehle',
  'messageComposer.attachmentSelector.file.text': 'Datei',
  'messageComposer.attachmentSelector.openAttachmentSelector.ariaLabel':
    'Anhangsauswahl öffnen',
  'messageComposer.audioAttachmentPreview.fileTooLarge.text': 'Datei zu groß',
  'messageComposer.audioAttachmentPreview.retryUpload.text': 'Upload wiederholen',
  'messageComposer.audioAttachmentPreview.uploadBlocked.text': 'Upload blockiert',
  'messageComposer.audioAttachmentPreview.uploadError.text': 'Upload-Fehler',
  'messageComposer.audioAttachmentPreview.uploadFailed.text': 'Upload fehlgeschlagen',
  'messageComposer.commandChip.exitCommand.ariaLabel': 'Befehl {{ command }} verlassen',
  'messageComposer.commandsMenu.backAttachments.ariaLabel': 'Zurück zu den Anhängen',
  'messageComposer.commandsMenu.instantCommands.text': 'Sofortbefehle',
  'messageComposer.dragDropUpload.dragFiles.text': 'Ziehe deine Dateien hierher',
  'messageComposer.dragDropUpload.someFilesNotAccepted.text':
    'Einige der Dateien werden nicht akzeptiert',
  'messageComposer.geolocationPreview.live.text': 'Live für {{duration}}',
  'messageComposer.geolocationPreview.location.text': 'Standort: {{ coordinates }}',
  'messageComposer.geolocationPreview.removeLocationAttachment.ariaLabel':
    'Standortanhang entfernen',
  'messageComposer.geolocationPreview.sharedLocation.title': 'Geteilter Standort',
  'messageComposer.icons.attachFiles.text': 'Dateien anhängen',
  'messageComposer.quotedMessagePreview.cancelReply.ariaLabel': 'Antwort abbrechen',
  'messageComposer.quotedMessagePreview.files.label_one': '{{ count }} Datei',
  'messageComposer.quotedMessagePreview.files.label_other': '{{ count }} Dateien',
  'messageComposer.quotedMessagePreview.jumpQuotedMessage.ariaLabel':
    'Zur zitierten Nachricht springen',
  'messageComposer.quotedMessagePreview.photo.label': 'Foto',
  'messageComposer.quotedMessagePreview.photos.label_one': '{{ count }} Foto',
  'messageComposer.quotedMessagePreview.photos.label_other': '{{ count }} Fotos',
  'messageComposer.quotedMessagePreview.reply.text': 'Antworten',
  'messageComposer.quotedMessagePreview.reply.withAuthorName.text':
    'Antwort an {{ authorName }}',
  'messageComposer.quotedMessagePreview.video.label': 'Video',
  'messageComposer.quotedMessagePreview.videos.label_one': '{{ count }} Video',
  'messageComposer.quotedMessagePreview.videos.label_other': '{{ count }} Videos',
  'messageComposer.quotedMessagePreview.voiceMessage.label':
    'Sprachnachricht {{ duration }}',
  'messageComposer.removeAttachmentPreview.removeAttachment.ariaLabel':
    'Anhang entfernen',
  'messageComposer.sendButton.send.ariaLabel': 'Senden',
  'messageComposer.sendChannelCheckbox.alsoSendChannel.label': 'Auch im Kanal senden',
  'messageComposer.sendChannelCheckbox.alsoSendDirectMessage.label':
    'Auch als Direktnachricht senden',
  'messageComposer.sendMessageFn.sendMessageRequestFailed.text':
    'Senden der Nachricht fehlgeschlagen',
  'messageComposer.stopAiGeneration.stopAiGeneration.ariaLabel': 'KI-Generierung stoppen',
  'messageComposer.updateMessageFn.editMessageRequestFailed.text':
    'Bearbeiten der Nachricht fehlgeschlagen',
  'messageList.newMessageNotification.newMessages.label': 'Neue Nachrichten!',
  'messageList.scrollLatestMessage.jumpLatestMessage.ariaLabel':
    'Zur neuesten Nachricht springen',
  'messageList.unreadMessagesNotification.markMessagesRead.ariaLabel':
    'Nachrichten als gelesen markieren',
  'messageList.unreadMessagesNotification.unread.text_one': '{{count}} ungelesen',
  'messageList.unreadMessagesNotification.unread.text_other': '{{count}} ungelesen',
  'messageList.unreadMessagesNotification.unreadMessages.text': 'Ungelesene Nachrichten',
  'messagePreview.latestMessagePreview.fileCount.label_one': 'Datei',
  'messagePreview.latestMessagePreview.fileCount.label_other': '{{ count }} Dateien',
  'messagePreview.latestMessagePreview.imageCount.label_one': 'Bild',
  'messagePreview.latestMessagePreview.imageCount.label_other': '{{ count }} Bilder',
  'messagePreview.latestMessagePreview.linkCount.label_one': 'Link',
  'messagePreview.latestMessagePreview.linkCount.label_other': '{{ count }} Links',
  'messagePreview.latestMessagePreview.messageFailedSend.text':
    'Nachricht konnte nicht gesendet werden',
  'messagePreview.latestMessagePreview.videoCount.label_one': 'Video',
  'messagePreview.latestMessagePreview.videoCount.label_other': '{{ count }} Videos',
  'messagePreview.latestMessagePreview.voiceMessageCount.label_one': 'Sprachnachricht',
  'messagePreview.latestMessagePreview.voiceMessageCount.label_other':
    '{{ count }} Sprachnachrichten',
  'notification.attachmentFileMissing': 'Für den Anhang ist eine Datei erforderlich',
  'notification.attachmentIdMissing': 'Dem lokalen Anhang fehlt die lokale ID',
  'notification.attachmentUploadBlockedWithReason':
    'Anhang-Upload blockiert wegen {{reason}}',
  'notification.attachmentUploadFailed': 'Fehler beim Hochladen des Anhangs',
  'notification.attachmentUploadFailedWithReason':
    'Anhang-Upload fehlgeschlagen wegen {{reason}}',
  'notification.attachmentUploadInProgress': 'Warte, bis alle Anhänge hochgeladen sind',
  'notification.audioPlaybackError': 'Fehler beim Abspielen der Aufnahme',
  'notification.commandDisabled': 'Befehl nicht verfügbar',
  'notification.commandDisabledWhileEditing': 'Befehl beim Bearbeiten nicht verfügbar',
  'notification.commandDisabledWhileReplying': 'Befehl beim Antworten nicht verfügbar',
  'notification.dismissNotification.ariaLabel': 'Benachrichtigung schließen',
  'notification.jumpToFirstUnreadFailed':
    'Sprung zur ersten ungelesenen Nachricht fehlgeschlagen',
  'notification.list.notifications.ariaLabel': 'Benachrichtigungen',
  'notification.locationGetFailed': 'Standort konnte nicht ermittelt werden',
  'notification.locationShareFailed': 'Standort konnte nicht geteilt werden',
  'notification.pollCreateFailed': 'Umfrage konnte nicht erstellt werden',
  'notification.pollCreateFailedWithReason':
    'Umfrage konnte nicht erstellt werden wegen {{reason}}',
  'notification.pollEndFailed': 'Umfrage konnte nicht beendet werden',
  'notification.pollEndFailedWithReason':
    'Umfrage konnte nicht beendet werden wegen {{reason}}',
  'notification.pollEndSuccess': 'Umfrage beendet',
  'notification.pollVoteLimit':
    'Stimmenlimit erreicht. Entferne zuerst eine vorhandene Stimme.',
  'notification.reason.sizeLimit': 'Größenbeschränkung',
  'notification.reason.unknownError': 'unbekannter Fehler',
  'notification.reason.unsupportedFileType': 'nicht unterstützter Dateityp',
  'notification.replySearchFailed': 'Thread wurde nicht gefunden',
  'poll.actions.suggestOption.label': 'Option vorschlagen',
  'poll.actions.viewComments.label_one': '{{count}} Kommentar ansehen',
  'poll.actions.viewComments.label_other': '{{count}} Kommentare ansehen',
  'poll.actions.viewResults.label': 'Ergebnisse ansehen',
  'poll.addCommentPrompt.addComment.label': 'Kommentar hinzufügen',
  'poll.addCommentPrompt.addCommentPollAnswer.label':
    'Füge deiner Umfrageantwort einen Kommentar hinzu',
  'poll.addCommentPrompt.fieldCannotEmptyContain.label':
    'Dieses Feld darf nicht leer sein und nicht nur Leerzeichen enthalten',
  'poll.addCommentPrompt.update.text': 'Aktualisieren',
  'poll.addCommentPrompt.updateComment.label': 'Kommentar aktualisieren',
  'poll.addCommentPrompt.updateCommentAttachedPoll.label':
    'Aktualisiere den Kommentar zu deiner Umfrageantwort',
  'poll.answerList.description': 'Kommentare zu den Umfrageantworten ansehen',
  'poll.answerList.pollComments.title': 'Umfragekommentare',
  'poll.creationDialog.allowOthersAddComments.description':
    'Anderen erlauben, Kommentare hinzuzufügen',
  'poll.creationDialog.anonymousPoll.title': 'Anonyme Umfrage',
  'poll.creationDialog.createPoll.title': 'Umfrage erstellen',
  'poll.creationDialog.hideWhoVoted.description': 'Verbergen, wer abgestimmt hat',
  'poll.creationDialog.letOthersAddOptions.description':
    'Anderen erlauben, Optionen hinzuzufügen',
  'poll.creationDialog.pollSent.text': 'Umfrage gesendet',
  'poll.creationDialog.sendPoll.text': 'Umfrage senden',
  'poll.endPollAlert.description':
    'Möchtest du diese Umfrage jetzt beenden? Danach kann niemand mehr abstimmen.',
  'poll.endPollAlert.endPoll.text': 'Umfrage beenden',
  'poll.endPollAlert.endPoll.title': 'Diese Umfrage beenden?',
  'poll.header.selectOne.label': 'Wähle eine Option',
  'poll.header.selectOneMore.label': 'Wähle eine oder mehrere Optionen',
  'poll.header.selectUp.label_one': 'Wähle bis zu {{count}}',
  'poll.header.selectUp.label_other': 'Wähle bis zu {{count}}',
  'poll.header.voteEnded.label': 'Abstimmung beendet',
  'poll.multipleAnswersField.chooseBetween210.description':
    'Wähle zwischen 2 und 10 Optionen',
  'poll.multipleAnswersField.enforceUniqueVoteEnabled.label':
    'Eindeutige Stimme erzwingen ist aktiviert',
  'poll.multipleAnswersField.limitVotesPerPerson.title': 'Stimmen pro Person begrenzen',
  'poll.multipleAnswersField.maximumVotesPerPerson.ariaLabel':
    'Maximale Stimmen pro Person',
  'poll.multipleAnswersField.multipleVotes.title': 'Mehrere Stimmen',
  'poll.multipleAnswersField.onlyNumbersAllowed.label': 'Nur Zahlen sind erlaubt',
  'poll.multipleAnswersField.selectMoreThanOne.description':
    'Mehr als eine Option auswählen',
  'poll.multipleAnswersField.typeNumber210.label': 'Gib eine Zahl von 2 bis 10 ein',
  'poll.nameField.askQuestion.placeholder': 'Stelle eine Frage',
  'poll.nameField.error.text': 'Fehler',
  'poll.nameField.questionRequired.label': 'Eine Frage ist erforderlich',
  'poll.optionFieldSet.addOption.placeholder': 'Option hinzufügen',
  'poll.optionFieldSet.option.ariaLabel': 'Option {{ position }}',
  'poll.optionFieldSet.optionCanReorderedRemoved.ariaLabel':
    'Diese Option kann neu angeordnet und entfernt werden.',
  'poll.optionFieldSet.optionEmpty.label': 'Option ist leer',
  'poll.optionFieldSet.options.label': 'Optionen',
  'poll.optionFieldSet.optionsCanNowReordered.ariaLabel':
    'Optionen können jetzt neu angeordnet und entfernt werden.',
  'poll.optionFieldSet.removeOption.ariaLabel': 'Option entfernen: {{ option }}',
  'poll.optionList.moreOptions.label_one': '+{{count}} weitere Option',
  'poll.optionList.moreOptions.label_other': '+{{count}} weitere Optionen',
  'poll.optionReorder.pressSpaceSelectOption.ariaLabel':
    'Drücke die Leertaste, um diese Option auszuwählen, verschiebe sie mit den Pfeiltasten nach oben und unten und drücke die Leertaste erneut, um die Auswahl aufzuheben.',
  'poll.optionReorder.reorderOption.ariaLabel': 'Option {{ position }} neu anordnen',
  'poll.optionReorder.reorderPosition.ariaLabel':
    '„{{ option }}“ an Position {{ position }} von {{ total }} neu anordnen',
  'poll.optionVotes.question.text': 'Frage {{ optionOrderNumber}}',
  'poll.optionVotes.view.text': 'Alle ansehen',
  'poll.optionVotes.votes.text_one': '{{count}} Stimme',
  'poll.optionVotes.votes.text_other': '{{count}} Stimmen',
  'poll.optionsFull.description': 'Alle in dieser Umfrage verfügbaren Optionen ansehen',
  'poll.optionsFull.pollOptions.title': 'Umfrageoptionen',
  'poll.pollComment.placeholder': 'Dein Kommentar',
  'poll.pollOptionSuggestion.placeholder': 'Neue Option eingeben',
  'poll.question.question.text': 'Frage',
  'poll.results.pollResults.title': 'Umfrageergebnisse',
  'poll.results.reviewPollResultsOpen.description':
    'Umfrageergebnisse ansehen und eine Option öffnen, um die Stimmen im Detail zu sehen',
  'poll.results.reviewWhoVotedOption.description':
    'Ansehen, wer für diese Option gestimmt hat',
  'poll.results.totalVoteCount.text_one': '1 Stimme insgesamt',
  'poll.results.totalVoteCount.text_other': '{{ count }} Stimmen insgesamt',
  'poll.results.votes.title': 'Stimmen',
  'poll.suggestPollOption.description': 'Eine neue Option für diese Umfrage vorschlagen',
  'poll.suggestPollOption.optionAlreadyExists.label': 'Option existiert bereits',
  'reactions.fetchReactions.errorFetchingReactions.text':
    'Fehler beim Laden der Reaktionen',
  'reactions.messageReactions.reactionList.ariaLabel': 'Reaktionsliste',
  'reactions.messageReactions.selectReaction.ariaLabel':
    'Reaktion auswählen: {{ reactionName }}',
  'reactions.messageReactionsDetail.reactions.text_one': '{{ count }} Reaktion',
  'reactions.messageReactionsDetail.reactions.text_other': '{{ count }} Reaktionen',
  'reactions.messageReactionsDetail.tapRemove.ariaLabel':
    'Zum Entfernen tippen: {{ reactionName }}',
  'reactions.messageReactionsDetail.tapRemove.text': 'Zum Entfernen tippen',
  'relativeTime.daysAgo_one': 'vor {{ count }} Tg.',
  'relativeTime.daysAgo_other': 'vor {{ count }} Tg.',
  'relativeTime.today': 'Heute',
  'relativeTime.weeksAgo_one': 'vor {{ count }} Wo.',
  'relativeTime.weeksAgo_other': 'vor {{ count }} Wo.',
  'relativeTime.yesterday': 'Gestern',
  'search.bar.clearSearch.ariaLabel': 'Suche leeren',
  'search.bar.exitSearch.ariaLabel': 'Suche beenden',
  'search.resultItem.selectUserChannel.ariaLabel': 'Benutzerkanal auswählen: {{ name }}',
  'search.results.searchResults.ariaLabel': 'Suchergebnisse',
  'search.resultsHeader.ariaLabel':
    'Filterschaltfläche der Suchergebnisse für: {{ source }}',
  'search.resultsHeader.filterSource.channels': 'Kanäle',
  'search.resultsHeader.filterSource.messages': 'Nachrichten',
  'search.resultsHeader.filterSource.users': 'Benutzer',
  'search.resultsPresearch.startTypingSearch.text': 'Tippen, um zu suchen',
  'search.sourceResults.noResultsFound.text': 'Keine Ergebnisse gefunden',
  'search.sourceResults.searching.text': 'Suche nach {{ searchSourceType }}...',
  'slotLayout.chatView.channels.text': 'Kanäle',
  'slotLayout.chatView.chatViewControls.ariaLabel': 'Chat-Ansichtssteuerung',
  'slotLayout.chatView.openChannelsView.ariaLabel': 'Kanalansicht öffnen',
  'slotLayout.chatView.openThreadsView.ariaLabel': 'Thread-Ansicht öffnen',
  'slotLayout.chatView.openThreadsViewUnread.ariaLabel_one':
    'Thread-Ansicht öffnen, {{ count }} ungelesener Thread',
  'slotLayout.chatView.openThreadsViewUnread.ariaLabel_other':
    'Thread-Ansicht öffnen, {{ count }} ungelesene Threads',
  'textareaComposer.messageInput.ariaLabel': 'Nachrichteneingabe',
  'textareaComposer.roleItem.notifyMembers.label':
    'Alle {{ role }}-Mitglieder benachrichtigen',
  'textareaComposer.suggestionList.commandSuggestions.ariaLabel': 'Befehlsvorschläge',
  'textareaComposer.suggestionList.emojiSuggestions.ariaLabel': 'Emoji-Vorschläge',
  'textareaComposer.suggestionList.mentionSuggestions.ariaLabel': 'Erwähnungsvorschläge',
  'textareaComposer.suggestionList.suggestions.ariaLabel': 'Vorschläge',
  'textareaComposer.textareaPlaceholder.searchGiFs.label': 'GIFs suchen',
  'textareaComposer.textareaPlaceholder.sendMessage.label': 'Nachricht schreiben',
  'textareaComposer.textareaPlaceholder.slowModeWaitS.label':
    'Langsamer Modus, warte {{ seconds }}s...',
  'thread.header.closeThread.ariaLabel': 'Thread schließen',
  'thread.header.thread.text': 'Thread',
  'threadList.chat.ariaLabel': 'Chat: {{ channelName }}',
  'threadList.empty.text': 'Antworte auf eine Nachricht, um einen Thread zu starten',
  'threadList.thread.ariaLabel': 'Thread: {{ messagePreview }}',
  'threadList.threadList.ariaLabel': 'Thread-Liste',
  'threadList.unseenBanner.loading': 'Wird geladen...',
  'threadList.unseenBanner.unreadThreads_one': '{{ count }} ungelesener Thread',
  'threadList.unseenBanner.unreadThreads_other': '{{ count }} ungelesene Threads',
  'typing.manyUsers_one': '{{ count }} Person schreibt',
  'typing.manyUsers_other': '{{ count }} Personen schreiben',
  'typing.singleUser': '{{ typing }} schreibt',
  'typing.twoUsers': '{{ typing }} schreiben',
  'videoPlayer.videoThumbnail.playVideo.ariaLabel': 'Video abspielen',

  // The four keys below need translating even though they look like format expressions rather than
  // copy. dayjs takes the calendar wording as part of the format string (square brackets escape
  // literal text), so the day words are baked in — and because a per-key `calendarFormats` argument
  // replaces the locale's own calendar wholesale, the `calendar` block below cannot reach them.
  // Skip these and a translated app keeps rendering "Today" in its date separators. Everything
  // outside the brackets is a format token (LT, L, dddd, MMM) that dayjs localizes from the locale
  // imported at the top of this file.
  'timestamp.ChannelDetailPinnedMessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Gestern]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.ChannelPreviewTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Gestern]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.DateSeparator':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Heute]", "nextDay": "[Morgen]", "lastDay": "[Gestern]", "nextWeek": "dddd", "lastWeek": "[Letzten] dddd", "sameElse": "ddd, D. MMM" }) }}',
  'timestamp.ReminderNotification':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Heute] [um] HH:mm", "nextDay": "[Morgen] [um] HH:mm", "lastDay": "[Gestern] [um] HH:mm", "nextWeek": "dddd [um] HH:mm", "lastWeek": "[Letzten] dddd [um] HH:mm", "sameElse": "ddd, D. MMM [um] HH:mm" }) }}',
} as const satisfies TranslationDictionary;

/**
 * Every key that is copy — the formatter expressions the SDK resolves from its own bundled
 * defaults are not something an integrator translates.
 */
type TranslatableKey = Exclude<
  keyof TranslationCatalog,
  `duration.${string}` | `timestamp.${string}` | `translationBuilderTopic.${string}`
>;

/**
 * Compile-time completeness gate. `as const satisfies` above keeps the literal keys that
 * `keyof typeof` needs while still checking each one against the catalog, so this resolves to
 * `never` only when nothing is left untranslated. Add a key to the SDK without translating it here
 * and the error names it.
 */
type Untranslated = Exclude<TranslatableKey, keyof typeof deTranslations>;
type AssertNoneMissing<T extends never> = T;
export type GermanIsComplete = AssertNoneMissing<Untranslated>;

/**
 * Calendar wording for the keys that format against the locale's own calendar —
 * `timestamp.LiveLocation` and `timestamp.PollVoteTooltip`. Passed as the third argument to
 * `registerTranslation`, which is how a shared instance carries one config per language.
 */
export const deDayjsLocaleConfig = {
  calendar: {
    lastDay: '[gestern um] LT',
    lastWeek: '[letzten] dddd [um] LT',
    nextDay: '[morgen um] LT',
    nextWeek: 'dddd [um] LT',
    sameDay: '[heute um] LT',
    sameElse: 'L',
  },
};
