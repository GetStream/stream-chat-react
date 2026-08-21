// Italian for the example app. Same shape as ./de.ts — see that file for the annotated version.
import 'dayjs/locale/it.js';

import type { TranslationCatalog, TranslationDictionary } from 'stream-chat-react';

export const itTranslations = {
  'a11y.accessibleLabel.active.ariaLabel': 'Attivo',
  'a11y.accessibleLabel.unreadMessage.ariaLabel_one': '{{ count }} messaggio non letto',
  'a11y.accessibleLabel.unreadMessage.ariaLabel_other': '{{ count }} messaggi non letti',
  'a11y.incomingMessageAnnouncements.newMessage.label': 'Nuovo messaggio da {{user}}',
  'a11y.interactionAnnouncements.commandActivated.ariaLabel':
    'Comando attivato: {{ command }}',
  'a11y.interactionAnnouncements.droppedPosition.ariaLabel':
    '"{{ option }}" rilasciato in posizione {{ position }}.',
  'a11y.interactionAnnouncements.giphyCanceled.ariaLabel': 'Giphy annullato',
  'a11y.interactionAnnouncements.giphyImageChanged.ariaLabel': 'Immagine Giphy cambiata',
  'a11y.interactionAnnouncements.giphyImageChanged.withTitle.ariaLabel':
    'Immagine Giphy cambiata: {{ title }}',
  'a11y.interactionAnnouncements.giphySent.ariaLabel': 'Giphy inviato',
  'a11y.interactionAnnouncements.noSearchResultsFound.ariaLabel':
    'Nessun risultato di ricerca',
  'a11y.interactionAnnouncements.openedChannel.ariaLabel': 'Canale aperto: {{ name }}',
  'a11y.interactionAnnouncements.openedThread.ariaLabel': 'Thread aperto in {{ name }}',
  'a11y.interactionAnnouncements.pickedUpUseArrow.ariaLabel':
    '"{{ option }}" selezionato. Usa le frecce per riordinare. Premi Spazio o Tab per rilasciare.',
  'a11y.interactionAnnouncements.pollDialogOpened.ariaLabel':
    'Finestra del sondaggio aperta',
  'a11y.interactionAnnouncements.pollSent.ariaLabel': 'Sondaggio inviato',
  'a11y.interactionAnnouncements.pressEnterStartTyping.ariaLabel':
    'Premi Invio per iniziare a scrivere',
  'a11y.interactionAnnouncements.recordingPaused.ariaLabel': 'Registrazione in pausa',
  'a11y.interactionAnnouncements.recordingResumed.ariaLabel': 'Registrazione ripresa',
  'a11y.interactionAnnouncements.recordingStarted.ariaLabel': 'Registrazione avviata',
  'a11y.interactionAnnouncements.removedOption.ariaLabel': 'Opzione {{ option }} rimossa',
  'a11y.interactionAnnouncements.searchCleared.ariaLabel': 'Ricerca cancellata',
  'a11y.interactionAnnouncements.searchResults.ariaLabel_one': '{{ count }} risultato',
  'a11y.interactionAnnouncements.searchResults.ariaLabel_other': '{{ count }} risultati',
  'a11y.interactionAnnouncements.suggestions.ariaLabel_one': '{{ count }} suggerimento',
  'a11y.interactionAnnouncements.suggestions.ariaLabel_other': '{{ count }} suggerimenti',
  'a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel_one':
    '{{ count }} {{ suggestionsLabel }}',
  'a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel_other':
    '{{ count }} {{ suggestionsLabel }}',
  'a11y.interactionAnnouncements.userSelected.ariaLabel':
    'Utente selezionato: {{ user }}',
  'a11y.interactionAnnouncements.voiceMessageSent.ariaLabel': 'Messaggio vocale inviato',
  'a11y.interactionAnnouncements.voiceRecordingAttached.ariaLabel':
    'Registrazione vocale allegata',
  'aiState.indicator.generating.label': 'Generazione in corso...',
  'aiState.indicator.thinking.label': 'Sto pensando...',
  'attachment.actions.giphyActions.ariaLabel': 'Azioni Giphy',
  'attachment.actions.giphyPreviewOnlyVisible.ariaLabel':
    'Anteprima Giphy, visibile solo a te. Usa le azioni Invia, Mescola o Annulla.',
  'attachment.actions.shuffle.label': 'Mescola',
  'attachment.geolocation.liveUntil.text': 'In diretta fino a {{ timestamp }}',
  'attachment.geolocation.locationSharingEnded.text':
    'Condivisione della posizione terminata',
  'attachment.geolocation.openLocationMap.ariaLabel': 'Apri la posizione su una mappa',
  'attachment.geolocation.stopSharing.text': 'Interrompi la condivisione',
  'attachment.giphy.animatedGif.ariaLabel': 'GIF animata',
  'attachment.giphy.animatedGif.withTitle.ariaLabel': 'GIF animata: {{ title }}',
  'attachment.modalGallery.openGalleryImage.label':
    'Apri la galleria all’immagine {{ index }}',
  'attachment.modalGallery.openImageGallery.label': 'Apri l’immagine nella galleria',
  'attachment.unableRenderCard.text': 'questo contenuto non può essere visualizzato',
  'attachment.visibilityDisclaimer.onlyVisible.text': 'Visibile solo a te',
  'audioPlayback.audioPlayerNotifications.cannotSeekRecording.label':
    'Impossibile spostarsi nella registrazione',
  'audioPlayback.audioPlayerNotifications.failedPlayRecording.label':
    'Impossibile riprodurre la registrazione',
  'audioPlayback.audioPlayerNotifications.recordingFormatNotSupported.label':
    'Il formato della registrazione non è supportato e non può essere riprodotto',
  'audioPlayback.progressBar.seekAudioPosition.ariaLabel': 'Cerca posizione audio',
  'audioPlayback.progressBarA11y.audioPosition.ariaLabel':
    'Posizione audio {{ elapsed }} di {{ duration }}',
  'audioPlayback.progressBarA11y.audioPositionPercent.ariaLabel':
    'Posizione audio {{ progress }} percento',
  'baseImage.imagePlaceholder.imageFailedLoad.ariaLabel':
    'Impossibile caricare l’immagine',
  'channel.channelMissing.text': 'Canale mancante',
  'channelDetail.avatarChannelDetail.channelDetails.ariaLabel': 'Dettagli del canale',
  'channelDetail.avatarChannelDetail.openChannelDetails.ariaLabel':
    'Apri i dettagli del canale',
  'channelDetail.channelFilesEmpty.noFiles.text': 'Nessun file',
  'channelDetail.channelFilesEmpty.shareFileSee.text':
    'Condividi un file per vederlo qui',
  'channelDetail.channelFilesView.files.title': 'File',
  'channelDetail.channelManagementActions.blockUser.title': 'Blocca utente',
  'channelDetail.channelManagementActions.chatDeleted.text': 'Chat eliminata',
  'channelDetail.channelManagementActions.deleteChat.title': 'Elimina chat',
  'channelDetail.channelManagementActions.errorBlockingUser.text':
    'Errore durante il blocco dell’utente',
  'channelDetail.channelManagementActions.errorDeletingChat.text':
    'Errore durante l’eliminazione della chat',
  'channelDetail.channelManagementActions.errorMutingChannel.text':
    'Errore durante il silenziamento del canale',
  'channelDetail.channelManagementActions.errorMutingUser.text':
    'Errore durante il silenziamento dell’utente',
  'channelDetail.channelManagementActions.errorUnblockingUser.text':
    'Errore durante lo sblocco dell’utente',
  'channelDetail.channelManagementActions.errorUnmutingChannel.text':
    'Errore durante la riattivazione del canale',
  'channelDetail.channelManagementActions.errorUnmutingUser.text':
    'Errore durante la riattivazione dell’utente',
  'channelDetail.channelManagementActions.leaveChat.title': 'Lascia la chat',
  'channelDetail.channelManagementActions.muteChat.title': 'Silenzia chat',
  'channelDetail.channelManagementActions.muteUser.title': 'Silenzia utente',
  'channelDetail.channelManagementActions.permanentlyDeletesMessageHistory.description':
    'Questo elimina definitivamente la cronologia dei messaggi con {{ user }}. L’azione non può essere annullata.',
  'channelDetail.channelManagementActions.sureWantLeaveChannel.description':
    'Vuoi davvero lasciare questo canale?',
  'channelDetail.channelManagementActions.unmuteChat.title': 'Riattiva chat',
  'channelDetail.channelManagementActions.unmuteUser.title': 'Riattiva utente',
  'channelDetail.channelManagementActions.userAbleMessageAgain.description':
    'Questo utente potrà scriverti di nuovo.',
  'channelDetail.channelManagementActions.userMuted.text': 'Utente silenziato',
  'channelDetail.channelManagementActions.userUnmuted.text': 'Utente riattivato',
  'channelDetail.channelManagementActions.userWonTAble.description':
    'Questo utente non potrà più scriverti. Puoi sbloccarlo in qualsiasi momento.',
  'channelDetail.channelManagementView.changesSaved.text': 'Modifiche salvate',
  'channelDetail.channelManagementView.contactInfo.label': 'Informazioni contatto',
  'channelDetail.channelManagementView.contactName.label': 'Nome del contatto',
  'channelDetail.channelManagementView.edit.text': 'Modifica',
  'channelDetail.channelManagementView.editChatData.ariaLabel':
    'Modifica i dati della chat',
  'channelDetail.channelManagementView.editContact.label': 'Modifica contatto',
  'channelDetail.channelManagementView.editGroup.label': 'Modifica gruppo',
  'channelDetail.channelManagementView.failedSaveChanges.text':
    'Impossibile salvare le modifiche',
  'channelDetail.channelManagementView.groupInfo.label': 'Informazioni gruppo',
  'channelDetail.channelManagementView.groupName.label': 'Nome del gruppo',
  'channelDetail.channelManagementView.manageChannel.description': 'Gestisci canale',
  'channelDetail.channelManagementView.save.text': 'Salva',
  'channelDetail.channelManagementView.uploadPicture.text': 'Carica immagine',
  'channelDetail.channelMediaEmpty.noPhotosVideos.text': 'Nessuna foto o video',
  'channelDetail.channelMediaEmpty.sharePhotoVideoSee.text':
    'Condividi una foto o un video per vederlo qui',
  'channelDetail.channelMediaView.next.text': 'Avanti',
  'channelDetail.channelMediaView.nextPage.ariaLabel': 'Pagina successiva',
  'channelDetail.channelMediaView.openImageShared.ariaLabel':
    'Apri l’immagine condivisa da {{ name }}',
  'channelDetail.channelMediaView.openVideoShared.ariaLabel':
    'Apri il video condiviso da {{ name }}',
  'channelDetail.channelMediaView.photosVideos.title': 'Foto e video',
  'channelDetail.channelMediaView.previous.text': 'Indietro',
  'channelDetail.channelMediaView.previousPage.ariaLabel': 'Pagina precedente',
  'channelDetail.channelMemberActions.ableMessageAgain.description':
    '{{ member }} potrà scriverti di nuovo.',
  'channelDetail.channelMemberActions.errorOpeningDirectMessage.text':
    'Errore durante l’apertura del messaggio diretto',
  'channelDetail.channelMemberActions.errorRemovingUser.text':
    'Errore durante la rimozione dell’utente',
  'channelDetail.channelMemberActions.removeChannel.description':
    'Rimuovere {{ member }} da questo canale?',
  'channelDetail.channelMemberActions.removeUser.title': 'Rimuovi utente',
  'channelDetail.channelMemberActions.sendDirectMessage.title': 'Invia messaggio diretto',
  'channelDetail.channelMemberActions.unblockUser.title': 'Sblocca utente',
  'channelDetail.channelMemberActions.userRemoved.text': 'Utente rimosso',
  'channelDetail.channelMemberActions.wonTAbleMessage.description':
    '{{ member }} non potrà più scriverti.',
  'channelDetail.channelMemberDetail.lastSeen.label': 'Ultimo accesso {{ timestamp }}',
  'channelDetail.channelMemberDetail.memberDetail.title': 'Dettagli del membro',
  'channelDetail.channelMembersAdd.addMembers.text_one': 'Aggiungi {{ count }} membro',
  'channelDetail.channelMembersAdd.addMembers.text_other': 'Aggiungi {{ count }} membri',
  'channelDetail.channelMembersAdd.alreadyMember.label': 'Già membro',
  'channelDetail.channelMembersAdd.errorAddingMembers.text':
    'Errore durante l’aggiunta dei membri',
  'channelDetail.channelMembersAdd.membersAdded.text_one': '{{ count }} membro aggiunto',
  'channelDetail.channelMembersAdd.membersAdded.text_other':
    '{{ count }} membri aggiunti',
  'channelDetail.channelMembersAdd.noUserFound.text': 'Nessun utente trovato',
  'channelDetail.channelMembersBrowse.admin.label': 'Amministratore',
  'channelDetail.channelMembersBrowse.moderator.label': 'Moderatore',
  'channelDetail.channelMembersBrowse.noMemberFound.text': 'Nessun membro trovato',
  'channelDetail.channelMembersBrowse.owner.label': 'Proprietario',
  'channelDetail.channelMembersBrowse.viewMemberDetails.ariaLabel':
    'Vedi i dettagli del membro {{ member }}',
  'channelDetail.channelMembersHeader.actions.text': 'Azioni',
  'channelDetail.channelMembersHeader.add.text': 'Aggiungi',
  'channelDetail.channelMembersHeader.addChannelMembers.ariaLabel':
    'Aggiungi membri al canale',
  'channelDetail.channelMembersHeader.openMembersActions.ariaLabel':
    'Apri le azioni sui membri',
  'channelDetail.channelMembersView.addMembers.label': 'Aggiungi membri',
  'channelDetail.channelMembersView.browseChannelMembers.description':
    'Sfoglia i membri del canale',
  'channelDetail.channelMembersView.members.title_one': '{{ count }} membro',
  'channelDetail.channelMembersView.members.title_other': '{{ count }} membri',
  'channelDetail.pinnedMessagesEmpty.noPinnedMessages.text': 'Nessun messaggio fissato',
  'channelDetail.pinnedMessagesEmpty.pinMessageSee.text':
    'Fissa un messaggio per vederlo qui',
  'channelDetail.pinnedMessagesView.browsePinnedMessages.description':
    'Sfoglia i messaggi fissati',
  'channelDetail.pinnedMessagesView.noMessagesFound.text': 'Nessun messaggio trovato',
  'channelDetail.pinnedMessagesView.pinnedMessage.label': 'Messaggio fissato',
  'channelDetail.pinnedMessagesView.pinnedMessages.title': 'Messaggi fissati',
  'channelDetail.sectionNavigatorHeader.openMenu.ariaLabel': 'Apri menu',
  'channelHeader.online.members.label': '{{ memberCount }} membri',
  'channelHeader.online.online.label': '{{ watcherCount }} online',
  'channelList.channelList.ariaLabel': 'Elenco canali',
  'channelList.header.chats.text': 'Chat',
  'channelListItem.archive.title': 'Archivia',
  'channelListItem.attachment.ariaLabel': 'Allegato',
  'channelListItem.attachment.text': '🏙 Allegato...',
  'channelListItem.attachment.withAttachmentType.ariaLabel':
    'Allegato {{ attachmentType }}',
  'channelListItem.attachmentCount.ariaLabel_one': '{{ count }} allegato',
  'channelListItem.attachmentCount.ariaLabel_other': '{{ count }} allegati',
  'channelListItem.audio.ariaLabel': 'audio',
  'channelListItem.channelActions.ariaLabel': 'Azioni del canale',
  'channelListItem.channelArchived.text': 'Canale archiviato',
  'channelListItem.channelDisplayName.directMessage.label': 'Messaggio diretto',
  'channelListItem.channelPinned.text': 'Canale fissato',
  'channelListItem.channelUnarchived.text': 'Canale ripristinato dall’archivio',
  'channelListItem.channelUnpinned.text': 'Canale rimosso dai fissati',
  'channelListItem.created.text': '📊 {{createdBy}} ha creato: {{ pollName}}',
  'channelListItem.delivered.ariaLabel': 'Consegnato',
  'channelListItem.deliveryStatus.ariaLabel': 'Stato di consegna: {{ deliveryStatus }}',
  'channelListItem.failedBlockUser.text': 'Impossibile bloccare l’utente',
  'channelListItem.failedUpdateChannelArchive.text':
    'Impossibile aggiornare lo stato di archiviazione del canale',
  'channelListItem.failedUpdateChannelMute.text':
    'Impossibile aggiornare lo stato di silenziamento del canale',
  'channelListItem.failedUpdateChannelPinned.text':
    'Impossibile aggiornare lo stato dei canali fissati',
  'channelListItem.file.ariaLabel': 'file',
  'channelListItem.gif.ariaLabel': 'GIF',
  'channelListItem.image.ariaLabel': 'immagine',
  'channelListItem.lastMessage.withMessagePreview.ariaLabel':
    'Ultimo messaggio: {{ messagePreview }}',
  'channelListItem.lastMessage.withSenderAndMessagePreview.ariaLabel':
    'Ultimo messaggio da {{ sender }}: {{ messagePreview }}',
  'channelListItem.leaveChannel.title': 'Lascia il canale',
  'channelListItem.messageAttachments.ariaLabel': 'Messaggio con allegati',
  'channelListItem.noMessagesChat.ariaLabel': 'Non ci sono messaggi in questa chat.',
  'channelListItem.openChannelActionsMenu.ariaLabel':
    'Apri il menu delle azioni del canale',
  'channelListItem.poll.ariaLabel': 'Sondaggio: {{ pollName }}',
  'channelListItem.read.ariaLabel': 'Letto',
  'channelListItem.sent.ariaLabel': 'Inviato',
  'channelListItem.sharedLink.ariaLabel': 'Ha condiviso un link',
  'channelListItem.sharedLinkTitle.ariaLabel':
    'Ha condiviso un link con titolo: {{ linkTitle }}',
  'channelListItem.sharedLocation.ariaLabel': 'Posizione condivisa',
  'channelListItem.sharedLocation.text': '📍Posizione condivisa',
  'channelListItem.unarchive.title': 'Rimuovi dall’archivio',
  'channelListItem.unblockUser.title': 'Sblocca utente',
  'channelListItem.video.ariaLabel': 'video',
  'channelListItem.voiceMessage.ariaLabel': 'messaggio vocale',
  'channelListItem.voted.text': '📊 {{votedBy}} ha votato: {{pollOptionText}}',
  'chat.reportLostConnection.waitingNetwork.text': 'In attesa della rete…',
  'command.ban.args': '[@nomeutente] [testo]',
  'command.ban.description': 'Banna un utente',
  'command.giphy.args': '[testo]',
  'command.giphy.description': 'Pubblica una GIF casuale nel canale',
  'command.mute.args': '[@nomeutente]',
  'command.mute.description': 'Silenzia un utente',
  'command.unban.args': '[@nomeutente]',
  'command.unban.description': 'Rimuovi il ban di un utente',
  'command.unmute.args': '[@nomeutente]',
  'command.unmute.description': 'Riattiva un utente',
  'common.addReaction.text': 'Aggiungi reazione',
  'common.anonymous.label': 'Anonimo',
  'common.back.label': 'Indietro',
  'common.blockUser.title': 'Blocca utente',
  'common.cancel.label': 'Annulla',
  'common.channelMuted.text': 'Canale silenziato',
  'common.channelUnmuted.text': 'Canale riattivato',
  'common.close.ariaLabel': 'Chiudi',
  'common.createQuestionAddOptions.label':
    'Crea una domanda, aggiungi opzioni e configura le impostazioni del sondaggio',
  'common.currentLocation.text': 'Posizione attuale',
  'common.delete.text': 'Elimina',
  'common.downloadAttachment.ariaLabel': 'Scarica allegato',
  'common.downloadAttachment.title': 'Scarica allegato',
  'common.editMessage.text': 'Modifica messaggio',
  'common.emptyMessage.text': 'Messaggio vuoto...',
  'common.errorDeletingMessage.label': 'Errore durante l’eliminazione del messaggio',
  'common.errorMutingUser.label': 'Errore durante il silenziamento di un utente ...',
  'common.errorPinningMessage.label': 'Errore durante il fissaggio del messaggio',
  'common.errorRemovingMessagePin.label':
    'Errore durante la rimozione del messaggio fissato',
  'common.errorUnmutingUser.label': 'Errore durante la riattivazione di un utente ...',
  'common.failedLeaveChannel.text': 'Impossibile lasciare il canale',
  'common.lastActivity.ariaLabel': 'Ultima attività: {{ time }}',
  'common.leftChannel.text': 'Hai lasciato il canale',
  'common.liveLocation.text': 'Posizione in tempo reale',
  'common.location.text': 'Posizione',
  'common.messageDeleted.text': 'Messaggio eliminato',
  'common.messagePinned.label': 'Messaggio fissato',
  'common.mute.title': 'Silenzia',
  'common.muted.label': '{{ user }} è stato silenziato',
  'common.newMessages.label_one': '{{count}} nuovo messaggio',
  'common.newMessages.label_other': '{{count}} nuovi messaggi',
  'common.nothingYet.text': 'Ancora nulla...',
  'common.offline.label': 'Offline',
  'common.online.label': 'Online',
  'common.openReactionSelector.ariaLabel': 'Apri il selettore di reazioni',
  'common.pause.ariaLabel': 'Pausa',
  'common.pin.title': 'Fissa',
  'common.play.ariaLabel': 'Riproduci',
  'common.playbackSpeedX.label': 'Velocità di riproduzione {{ rate }}x',
  'common.poll.label': 'Sondaggio',
  'common.reminderSet.text': 'Promemoria impostato',
  'common.replyCount.label_one': '1 risposta',
  'common.replyCount.label_other': '{{ count }} risposte',
  'common.resultsLoaded.label': 'Tutti i risultati caricati',
  'common.retryUpload.ariaLabel': 'Riprova il caricamento',
  'common.savedLater.text': 'Salvato per dopo',
  'common.search.ariaLabel': 'Cerca',
  'common.send.label': 'Invia',
  'common.threads.text': 'Thread',
  'common.unblock.ariaLabel': 'Sblocca',
  'common.unmute.title': 'Riattiva',
  'common.unmuted.label': '{{ user }} è stato riattivato',
  'common.unpin.title': 'Rimuovi dai fissati',
  'common.unsupportedAttachment.text': 'Allegato non supportato',
  'common.userBlocked.text': 'Utente bloccato',
  'common.userUnblocked.text': 'Utente sbloccato',
  'common.userUploadedContent.label': 'Contenuto caricato dall’utente',
  'common.voiceMessage.label': 'Messaggio vocale',
  'common.you.label': 'Tu',
  'dialog.callout.closeCalloutDialog.ariaLabel': 'Chiudi la finestra informativa',
  'dialog.contextMenu.backParentMenuButton.ariaLabel': 'Torna al menu principale',
  'dialog.contextMenu.submenu.ariaLabel': 'Sottomenu',
  'dialog.prompt.goBack.ariaLabel': 'Torna indietro',
  'dialog.viewer.closeDialog.ariaLabel': 'Chiudi la finestra',
  'emojiPicker.emojiPicker.ariaLabel': 'Selettore di emoji',
  'emptyState.indicator.noConversationsYet.label': 'Nessuna conversazione',
  'emptyState.indicator.noItemsExist.text': 'Nessun elemento presente',
  'emptyState.indicator.startConversation.label':
    'Invia un messaggio per iniziare la conversazione',
  'fileUpload.uploadButton.fileUpload.ariaLabel': 'Caricamento file',
  'form.numericInput.decreaseValue.ariaLabel': 'Diminuisci il valore',
  'form.numericInput.increaseValue.ariaLabel': 'Aumenta il valore',
  'form.switchField.disabled.ariaLabel': '{{ setting }} disattivato',
  'form.switchField.enabled.ariaLabel': '{{ setting }} attivato',
  'gallery.ui.nextImage.ariaLabel': 'Immagine successiva',
  'gallery.ui.previousImage.ariaLabel': 'Immagine precedente',
  'language.af': 'Afrikaans',
  'language.am': 'Amarico',
  'language.ar': 'Arabo',
  'language.az': 'Azerbaigiano',
  'language.bg': 'Bulgaro',
  'language.bn': 'Bengalese',
  'language.bs': 'Bosniaco',
  'language.cs': 'Ceco',
  'language.da': 'Danese',
  'language.de': 'Tedesco',
  'language.el': 'Greco',
  'language.en': 'Inglese',
  'language.es': 'Spagnolo',
  'language.es-MX': 'Spagnolo (Messico)',
  'language.et': 'Estone',
  'language.fa': 'Persiano',
  'language.fa-AF': 'Dari',
  'language.fi': 'Finlandese',
  'language.fr': 'Francese',
  'language.fr-CA': 'Francese (Canada)',
  'language.ha': 'Hausa',
  'language.he': 'Ebraico',
  'language.hi': 'Hindi',
  'language.hr': 'Croato',
  'language.ht': 'Creolo haitiano',
  'language.hu': 'Ungherese',
  'language.id': 'Indonesiano',
  'language.it': 'Italiano',
  'language.ja': 'Giapponese',
  'language.ka': 'Georgiano',
  'language.ko': 'Coreano',
  'language.lt': 'Lituano',
  'language.lv': 'Lettone',
  'language.ms': 'Malese',
  'language.nl': 'Olandese',
  'language.no': 'Norvegese',
  'language.pl': 'Polacco',
  'language.ps': 'Pashto',
  'language.pt': 'Portoghese',
  'language.ro': 'Romeno',
  'language.ru': 'Russo',
  'language.sk': 'Slovacco',
  'language.sl': 'Sloveno',
  'language.so': 'Somalo',
  'language.sq': 'Albanese',
  'language.sr': 'Serbo',
  'language.sv': 'Svedese',
  'language.sw': 'Swahili',
  'language.ta': 'Tamil',
  'language.th': 'Thai',
  'language.tl': 'Tagalog',
  'language.tr': 'Turco',
  'language.uk': 'Ucraino',
  'language.ur': 'Urdu',
  'language.vi': 'Vietnamita',
  'language.zh': 'Cinese (semplificato)',
  'language.zh-TW': 'Cinese (tradizionale)',
  'loadMore.button.loadMore.label': 'Carica altri',
  'loading.errorIndicator.error.text': 'Errore: {{ errorMessage }}',
  'loading.progressIndicators.percentComplete.ariaLabel':
    '{{percent}} percento completato',
  'location.shareLocationDialog.attach.text': 'Allega',
  'location.shareLocationDialog.description':
    'Seleziona la tua posizione attuale e attiva facoltativamente la condivisione in tempo reale',
  'location.shareLocationDialog.share.text': 'Condividi',
  'location.shareLocationDialog.shareLiveLocation.title':
    'Condividi la posizione in tempo reale per',
  'location.shareLocationDialog.shareLocation.title': 'Condividi posizione',
  'mediaRecorder.audioRecorderRecording.cancelRecording.ariaLabel':
    'Annulla registrazione',
  'mediaRecorder.audioRecorderRecording.completeRecording.ariaLabel':
    'Completa registrazione',
  'mediaRecorder.audioRecorderRecording.pauseRecording.ariaLabel':
    'Metti in pausa la registrazione',
  'mediaRecorder.audioRecorderRecording.resumeRecording.ariaLabel':
    'Riprendi la registrazione',
  'mediaRecorder.audioRecorderRecording.voiceMessageDeleted.text':
    'Messaggio vocale eliminato',
  'mediaRecorder.audioRecordingButton.startRecordingAudio.ariaLabel':
    'Avvia la registrazione audio',
  'mediaRecorder.error.processing':
    'Si è verificato un errore durante l’elaborazione della registrazione',
  'mediaRecorder.error.recording': 'Si è verificato un errore durante la registrazione',
  'mediaRecorder.error.start': 'Errore durante l’avvio della registrazione',
  'mediaRecorder.permissionDenied.camera.body':
    'Per iniziare a registrare, consenti l’accesso alla fotocamera nel browser',
  'mediaRecorder.permissionDenied.camera.heading': 'Consenti l’accesso alla fotocamera',
  'mediaRecorder.permissionDenied.microphone.body':
    'Per iniziare a registrare, consenti l’accesso al microfono nel browser',
  'mediaRecorder.permissionDenied.microphone.heading': 'Consenti l’accesso al microfono',
  'mention.channel.description': 'Notifica tutti in questo canale',
  'mention.here.description': 'Notifica tutti i membri online in questo canale',
  'message.alsoSent.alsoSentChannel.text': 'Inviato anche nel canale',
  'message.alsoSent.repliedThread.text': 'Ha risposto a un thread',
  'message.alsoSent.view.text': 'Vedi',
  'message.and.withCommaSeparatedUsersAndLastUser.label':
    '{{ commaSeparatedUsers }} e {{ lastUser }}',
  'message.and.withFirstUserAndSecondUser.label': '{{ firstUser }} e {{ secondUser }}',
  'message.blocked.text': 'Il messaggio è stato bloccato dalle norme di moderazione',
  'message.editedIndicator.edited.text': 'Modificato',
  'message.more.label': '{{ commaSeparatedUsers }} e altri {{ moreCount }}',
  'message.pinIndicator.pinned.label': 'Fissato da te',
  'message.pinIndicator.pinned.withName.label': 'Fissato da {{ name }}',
  'message.reminderNotification.due.label': 'In scadenza {{ timeLeft }}',
  'message.reminderNotification.dueSince.label': 'Scaduto da {{ dueSince }}',
  'message.status.delivered.text': 'Consegnato',
  'message.status.sending.text': 'Invio in corso...',
  'message.status.sent.text': 'Inviato',
  'message.text.message.ariaLabel': 'Messaggio,',
  'message.text.message.withUser.ariaLabel': 'Messaggio da {{ user }},',
  'message.translationIndicator.original.text': 'Originale',
  'message.translationIndicator.translated.text': 'Tradotto',
  'message.translationIndicator.translated.withLanguage.text':
    'Tradotto da {{ language }}',
  'message.translationIndicator.viewOriginal.text': 'Vedi originale',
  'message.translationIndicator.viewTranslation.text': 'Vedi traduzione',
  'message.ui.reviewBouncedMessage.ariaLabel': 'Rivedi il messaggio rifiutato',
  'messageActions.blockUser.ariaLabel': 'Blocca utente',
  'messageActions.bookmarkMessage.ariaLabel': 'Aggiungi il messaggio ai segnalibri',
  'messageActions.copyMessage.text': 'Copia messaggio',
  'messageActions.copyMessageText.ariaLabel': 'Copia il testo del messaggio',
  'messageActions.deleteMessage.ariaLabel': 'Elimina messaggio',
  'messageActions.deleteMessageAlert.deleteMessage.title': 'Elimina messaggio',
  'messageActions.deleteMessageAlert.description':
    'Vuoi davvero eliminare questo messaggio?',
  'messageActions.downloadSubmenu.download.label': 'Scarica {{ fileName }}',
  'messageActions.downloadSubmenu.download.text': 'Scarica tutto',
  'messageActions.downloadSubmenu.downloadAttachment.label':
    'Scarica allegato {{ number }}',
  'messageActions.editMessage.ariaLabel': 'Modifica messaggio',
  'messageActions.errorAddingFlag.text': 'Errore durante la segnalazione',
  'messageActions.errorMarkingMessageUnread.text':
    'Errore durante la marcatura come non letto. Non è possibile marcare come non letti i messaggi più vecchi dei 100 più recenti del canale.',
  'messageActions.flag.text': 'Segnala',
  'messageActions.flagMessage.ariaLabel': 'Segnala messaggio',
  'messageActions.markMessageUnread.ariaLabel': 'Segna il messaggio come non letto',
  'messageActions.markUnread.text': 'Segna come non letto',
  'messageActions.messageActions.ariaLabel': 'Azioni del messaggio',
  'messageActions.messageMarkedUnread.text': 'Messaggio segnato come non letto',
  'messageActions.messageSuccessfullyFlagged.text':
    'Il messaggio è stato segnalato con successo',
  'messageActions.messageUnpinned.text': 'Messaggio rimosso dai fissati',
  'messageActions.muteUser.ariaLabel': 'Silenzia utente',
  'messageActions.openMessageActionsMenu.ariaLabel':
    'Apri il menu delle azioni del messaggio',
  'messageActions.openThread.ariaLabel': 'Apri thread',
  'messageActions.pinMessage.ariaLabel': 'Fissa messaggio',
  'messageActions.quoteMessage.ariaLabel': 'Cita messaggio',
  'messageActions.quoteReply.text': 'Rispondi citando',
  'messageActions.remindMe.text': 'Ricordami',
  'messageActions.remindMeMessage.ariaLabel': 'Ricordami questo messaggio',
  'messageActions.remindMeSubmenu.remindMe.text': 'Ricordami',
  'messageActions.removeReminder.ariaLabel': 'Rimuovi promemoria',
  'messageActions.removeReminder.text': 'Rimuovi promemoria',
  'messageActions.removeSaveLater.ariaLabel': 'Rimuovi da Salvati per dopo',
  'messageActions.removeSaveLater.text': 'Rimuovi da salvati per dopo',
  'messageActions.resend.text': 'Invia di nuovo',
  'messageActions.resendMessage.ariaLabel': 'Invia di nuovo il messaggio',
  'messageActions.saveLater.text': 'Salva per dopo',
  'messageActions.threadReply.text': 'Rispondi nel thread',
  'messageActions.unmuteUser.ariaLabel': 'Riattiva utente',
  'messageActions.unpinMessage.ariaLabel': 'Rimuovi il messaggio dai fissati',
  'messageBounce.prompt.description':
    'Rivedi questo messaggio e scegli se eliminarlo, modificarlo o inviarlo comunque',
  'messageBounce.prompt.sendAnyway.text': 'Invia comunque',
  'messageBounce.prompt.title':
    'Questo messaggio non rispetta le nostre linee guida sui contenuti',
  'messageComposer.attachmentPreviewRoot.showPreview.ariaLabel': 'Mostra anteprima',
  'messageComposer.attachmentSelector.attachmentActions.ariaLabel':
    'Azioni sugli allegati',
  'messageComposer.attachmentSelector.commands.text': 'Comandi',
  'messageComposer.attachmentSelector.file.text': 'File',
  'messageComposer.attachmentSelector.openAttachmentSelector.ariaLabel':
    'Apri il selettore di allegati',
  'messageComposer.audioAttachmentPreview.fileTooLarge.text': 'File troppo grande',
  'messageComposer.audioAttachmentPreview.retryUpload.text': 'Riprova il caricamento',
  'messageComposer.audioAttachmentPreview.uploadBlocked.text': 'Caricamento bloccato',
  'messageComposer.audioAttachmentPreview.uploadError.text': 'Errore di caricamento',
  'messageComposer.audioAttachmentPreview.uploadFailed.text': 'Caricamento non riuscito',
  'messageComposer.commandChip.exitCommand.ariaLabel': 'Esci dal comando {{ command }}',
  'messageComposer.commandsMenu.backAttachments.ariaLabel': 'Torna agli allegati',
  'messageComposer.commandsMenu.instantCommands.text': 'Comandi rapidi',
  'messageComposer.dragDropUpload.dragFiles.text': 'Trascina qui i tuoi file',
  'messageComposer.dragDropUpload.someFilesNotAccepted.text':
    'Alcuni file non verranno accettati',
  'messageComposer.geolocationPreview.live.text': 'In diretta per {{duration}}',
  'messageComposer.geolocationPreview.location.text': 'Posizione: {{ coordinates }}',
  'messageComposer.geolocationPreview.removeLocationAttachment.ariaLabel':
    'Rimuovi l’allegato di posizione',
  'messageComposer.geolocationPreview.sharedLocation.title': 'Posizione condivisa',
  'messageComposer.icons.attachFiles.text': 'Allega file',
  'messageComposer.quotedMessagePreview.cancelReply.ariaLabel': 'Annulla risposta',
  'messageComposer.quotedMessagePreview.files.label_one': '{{ count }} file',
  'messageComposer.quotedMessagePreview.files.label_other': '{{ count }} file',
  'messageComposer.quotedMessagePreview.jumpQuotedMessage.ariaLabel':
    'Vai al messaggio citato',
  'messageComposer.quotedMessagePreview.photo.label': 'Foto',
  'messageComposer.quotedMessagePreview.photos.label_one': '{{ count }} foto',
  'messageComposer.quotedMessagePreview.photos.label_other': '{{ count }} foto',
  'messageComposer.quotedMessagePreview.reply.text': 'Rispondi',
  'messageComposer.quotedMessagePreview.reply.withAuthorName.text':
    'Rispondi a {{ authorName }}',
  'messageComposer.quotedMessagePreview.video.label': 'Video',
  'messageComposer.quotedMessagePreview.videos.label_one': '{{ count }} video',
  'messageComposer.quotedMessagePreview.videos.label_other': '{{ count }} video',
  'messageComposer.quotedMessagePreview.voiceMessage.label':
    'Messaggio vocale {{ duration }}',
  'messageComposer.removeAttachmentPreview.removeAttachment.ariaLabel':
    'Rimuovi allegato',
  'messageComposer.sendButton.send.ariaLabel': 'Invia',
  'messageComposer.sendChannelCheckbox.alsoSendChannel.label': 'Invia anche nel canale',
  'messageComposer.sendChannelCheckbox.alsoSendDirectMessage.label':
    'Invia anche come messaggio diretto',
  'messageComposer.sendMessageFn.sendMessageRequestFailed.text':
    'Invio del messaggio non riuscito',
  'messageComposer.stopAiGeneration.stopAiGeneration.ariaLabel':
    'Interrompi la generazione AI',
  'messageComposer.updateMessageFn.editMessageRequestFailed.text':
    'Modifica del messaggio non riuscita',
  'messageList.newMessageNotification.newMessages.label': 'Nuovi messaggi!',
  'messageList.scrollLatestMessage.jumpLatestMessage.ariaLabel':
    'Vai al messaggio più recente',
  'messageList.unreadMessagesNotification.markMessagesRead.ariaLabel':
    'Segna i messaggi come letti',
  'messageList.unreadMessagesNotification.unread.text_one': '{{count}} non letto',
  'messageList.unreadMessagesNotification.unread.text_other': '{{count}} non letti',
  'messageList.unreadMessagesNotification.unreadMessages.text': 'Messaggi non letti',
  'messagePreview.latestMessagePreview.fileCount.label_one': 'File',
  'messagePreview.latestMessagePreview.fileCount.label_other': '{{ count }} file',
  'messagePreview.latestMessagePreview.imageCount.label_one': 'Immagine',
  'messagePreview.latestMessagePreview.imageCount.label_other': '{{ count }} immagini',
  'messagePreview.latestMessagePreview.linkCount.label_one': 'Link',
  'messagePreview.latestMessagePreview.linkCount.label_other': '{{ count }} link',
  'messagePreview.latestMessagePreview.messageFailedSend.text':
    'Invio del messaggio non riuscito',
  'messagePreview.latestMessagePreview.videoCount.label_one': 'Video',
  'messagePreview.latestMessagePreview.videoCount.label_other': '{{ count }} video',
  'messagePreview.latestMessagePreview.voiceMessageCount.label_one': 'Messaggio vocale',
  'messagePreview.latestMessagePreview.voiceMessageCount.label_other':
    '{{ count }} messaggi vocali',
  'notification.attachmentFileMissing': 'È necessario un file per l’allegato',
  'notification.attachmentIdMissing': 'All’allegato locale manca l’id locale',
  'notification.attachmentUploadBlockedWithReason':
    'Caricamento dell’allegato bloccato a causa di {{reason}}',
  'notification.attachmentUploadFailed': 'Errore durante il caricamento dell’allegato',
  'notification.attachmentUploadFailedWithReason':
    'Caricamento dell’allegato non riuscito a causa di {{reason}}',
  'notification.attachmentUploadInProgress':
    'Attendi il caricamento di tutti gli allegati',
  'notification.audioPlaybackError': 'Errore durante la riproduzione della registrazione',
  'notification.commandDisabled': 'Comando non disponibile',
  'notification.commandDisabledWhileEditing':
    'Comando non disponibile durante la modifica',
  'notification.commandDisabledWhileReplying':
    'Comando non disponibile durante la risposta',
  'notification.commandNotReady': "Comando non pronto per l'invio",
  'notification.dismissNotification.ariaLabel': 'Chiudi la notifica',
  'notification.list.notifications.ariaLabel': 'Notifiche',
  'notification.locationGetFailed': 'Impossibile recuperare la posizione',
  'notification.locationShareFailed': 'Impossibile condividere la posizione',
  'notification.messageJumpFailed': 'Impossibile passare al messaggio',
  'notification.messageJumpToLatestFailed':
    'Impossibile passare al messaggio più recente',
  'notification.pollCreateFailed': 'Impossibile creare il sondaggio',
  'notification.pollCreateFailedWithReason':
    'Impossibile creare il sondaggio a causa di {{reason}}',
  'notification.pollEndFailed': 'Impossibile terminare il sondaggio',
  'notification.pollEndFailedWithReason':
    'Impossibile terminare il sondaggio a causa di {{reason}}',
  'notification.pollEndSuccess': 'Sondaggio terminato',
  'notification.pollVoteLimit':
    'Hai raggiunto il limite di voti. Rimuovi prima un voto esistente.',
  'notification.reason.sizeLimit': 'limite di dimensione',
  'notification.reason.unknownError': 'errore sconosciuto',
  'notification.reason.unsupportedFileType': 'tipo di file non supportato',
  'notification.replySearchFailed': 'Thread non trovato',
  'poll.actions.suggestOption.label': 'Suggerisci un’opzione',
  'poll.actions.viewComments.label_one': 'Vedi {{count}} commento',
  'poll.actions.viewComments.label_other': 'Vedi {{count}} commenti',
  'poll.actions.viewResults.label': 'Vedi i risultati',
  'poll.addCommentPrompt.addComment.label': 'Aggiungi un commento',
  'poll.addCommentPrompt.addCommentPollAnswer.label':
    'Aggiungi un commento alla tua risposta al sondaggio',
  'poll.addCommentPrompt.fieldCannotEmptyContain.label':
    'Questo campo non può essere vuoto né contenere solo spazi',
  'poll.addCommentPrompt.update.text': 'Aggiorna',
  'poll.addCommentPrompt.updateComment.label': 'Aggiorna il tuo commento',
  'poll.addCommentPrompt.updateCommentAttachedPoll.label':
    'Aggiorna il commento allegato alla tua risposta al sondaggio',
  'poll.answerList.description': 'Rivedi i commenti inviati con le risposte al sondaggio',
  'poll.answerList.pollComments.title': 'Commenti del sondaggio',
  'poll.creationDialog.allowOthersAddComments.description':
    'Consenti ad altri di aggiungere commenti',
  'poll.creationDialog.anonymousPoll.title': 'Sondaggio anonimo',
  'poll.creationDialog.createPoll.title': 'Crea sondaggio',
  'poll.creationDialog.hideWhoVoted.description': 'Nascondi chi ha votato',
  'poll.creationDialog.letOthersAddOptions.description':
    'Consenti ad altri di aggiungere opzioni',
  'poll.creationDialog.pollSent.text': 'Sondaggio inviato',
  'poll.creationDialog.sendPoll.text': 'Invia sondaggio',
  'poll.endPollAlert.description':
    'Vuoi terminare ora questo sondaggio? Nessuno potrà più votare.',
  'poll.endPollAlert.endPoll.text': 'Termina sondaggio',
  'poll.endPollAlert.endPoll.title': 'Terminare questo sondaggio?',
  'poll.header.selectOne.label': 'Seleziona una opzione',
  'poll.header.selectOneMore.label': 'Seleziona una o più opzioni',
  'poll.header.selectUp.label_one': 'Seleziona fino a {{count}}',
  'poll.header.selectUp.label_other': 'Seleziona fino a {{count}}',
  'poll.header.voteEnded.label': 'Votazione terminata',
  'poll.multipleAnswersField.chooseBetween210.description': 'Scegli da 2 a 10 opzioni',
  'poll.multipleAnswersField.enforceUniqueVoteEnabled.label':
    'L’obbligo di voto unico è attivo',
  'poll.multipleAnswersField.limitVotesPerPerson.title': 'Limita i voti per persona',
  'poll.multipleAnswersField.maximumVotesPerPerson.ariaLabel': 'Voti massimi per persona',
  'poll.multipleAnswersField.multipleVotes.title': 'Voti multipli',
  'poll.multipleAnswersField.onlyNumbersAllowed.label': 'Sono ammessi solo numeri',
  'poll.multipleAnswersField.selectMoreThanOne.description':
    'Seleziona più di una opzione',
  'poll.multipleAnswersField.typeNumber210.label': 'Inserisci un numero da 2 a 10',
  'poll.nameField.askQuestion.placeholder': 'Fai una domanda',
  'poll.nameField.questionRequired.label': 'La domanda è obbligatoria',
  'poll.optionFieldSet.addOption.placeholder': 'Aggiungi un’opzione',
  'poll.optionFieldSet.option.ariaLabel': 'Opzione {{ position }}',
  'poll.optionFieldSet.optionCanReorderedRemoved.ariaLabel':
    'Questa opzione può essere riordinata e rimossa.',
  'poll.optionFieldSet.optionEmpty.label': 'L’opzione è vuota',
  'poll.optionFieldSet.options.label': 'Opzioni',
  'poll.optionFieldSet.optionsCanNowReordered.ariaLabel':
    'Le opzioni possono ora essere riordinate e rimosse.',
  'poll.optionFieldSet.removeOption.ariaLabel': 'Rimuovi opzione: {{ option }}',
  'poll.optionList.moreOptions.label_one': '+{{count}} altra opzione',
  'poll.optionList.moreOptions.label_other': '+{{count}} altre opzioni',
  'poll.optionReorder.pressSpaceSelectOption.ariaLabel':
    'Premi Spazio per selezionare questa opzione, usa le frecce Su e Giù per spostarla, poi premi di nuovo Spazio per deselezionarla.',
  'poll.optionReorder.reorderOption.ariaLabel': 'Riordina l’opzione {{ position }}',
  'poll.optionReorder.reorderPosition.ariaLabel':
    'Riordina "{{ option }}" alla posizione {{ position }} di {{ total }}',
  'poll.optionVotes.question.text': 'Domanda {{ optionOrderNumber}}',
  'poll.optionVotes.view.text': 'Vedi tutti',
  'poll.optionVotes.votes.text_one': '{{count}} voto',
  'poll.optionVotes.votes.text_other': '{{count}} voti',
  'poll.optionsFull.description':
    'Rivedi tutte le opzioni disponibili in questo sondaggio',
  'poll.optionsFull.pollOptions.title': 'Opzioni del sondaggio',
  'poll.pollComment.placeholder': 'Il tuo commento',
  'poll.pollOptionSuggestion.placeholder': 'Inserisci una nuova opzione',
  'poll.question.question.text': 'Domanda',
  'poll.results.pollResults.title': 'Risultati del sondaggio',
  'poll.results.reviewPollResultsOpen.description':
    'Rivedi i risultati del sondaggio e apri un’opzione per vedere i voti in dettaglio',
  'poll.results.reviewWhoVotedOption.description':
    'Rivedi chi ha votato per questa opzione',
  'poll.results.totalVoteCount.text_one': '1 voto in totale',
  'poll.results.totalVoteCount.text_other': '{{ count }} voti in totale',
  'poll.results.votes.title': 'Voti',
  'poll.suggestPollOption.description':
    'Suggerisci una nuova opzione da aggiungere a questo sondaggio',
  'poll.suggestPollOption.optionAlreadyExists.label': 'L’opzione esiste già',
  'reactions.fetchReactions.errorFetchingReactions.text':
    'Errore durante il caricamento delle reazioni',
  'reactions.messageReactions.reactionList.ariaLabel': 'Elenco delle reazioni',
  'reactions.messageReactions.selectReaction.ariaLabel':
    'Seleziona reazione: {{ reactionName }}',
  'reactions.messageReactionsDetail.reactions.text_one': '{{ count }} reazione',
  'reactions.messageReactionsDetail.reactions.text_other': '{{ count }} reazioni',
  'reactions.messageReactionsDetail.tapRemove.ariaLabel':
    'Tocca per rimuovere: {{ reactionName }}',
  'reactions.messageReactionsDetail.tapRemove.text': 'Tocca per rimuovere',
  'relativeTime.daysAgo_one': '{{ count }}g fa',
  'relativeTime.daysAgo_other': '{{ count }}g fa',
  'relativeTime.today': 'Oggi',
  'relativeTime.weeksAgo_one': '{{ count }}sett fa',
  'relativeTime.weeksAgo_other': '{{ count }}sett fa',
  'relativeTime.yesterday': 'Ieri',
  'search.bar.clearSearch.ariaLabel': 'Cancella ricerca',
  'search.bar.exitSearch.ariaLabel': 'Esci dalla ricerca',
  'search.resultItem.selectUserChannel.ariaLabel':
    'Seleziona il canale utente: {{ name }}',
  'search.results.searchResults.ariaLabel': 'Risultati della ricerca',
  'search.resultsHeader.ariaLabel': 'Pulsante di filtro dei risultati per: {{ source }}',
  'search.resultsHeader.filterSource.channels': 'canali',
  'search.resultsHeader.filterSource.messages': 'messaggi',
  'search.resultsHeader.filterSource.users': 'utenti',
  'search.resultsPresearch.startTypingSearch.text': 'Inizia a digitare per cercare',
  'search.sourceResults.noResultsFound.text': 'Nessun risultato',
  'search.sourceResults.searching.text': 'Ricerca di {{ searchSourceType }}...',
  'slotLayout.chatView.channels.text': 'Canali',
  'slotLayout.chatView.chatViewControls.ariaLabel': 'Controlli della vista chat',
  'slotLayout.chatView.openChannelsView.ariaLabel': 'Apri la vista dei canali',
  'slotLayout.chatView.openThreadsView.ariaLabel': 'Apri la vista dei thread',
  'slotLayout.chatView.openThreadsViewUnread.ariaLabel_one':
    'Apri la vista dei thread, {{ count }} thread non letto',
  'slotLayout.chatView.openThreadsViewUnread.ariaLabel_other':
    'Apri la vista dei thread, {{ count }} thread non letti',
  'textareaComposer.messageInput.ariaLabel': 'Campo messaggio',
  'textareaComposer.roleItem.notifyMembers.label': 'Notifica tutti i membri {{ role }}',
  'textareaComposer.suggestionList.commandSuggestions.ariaLabel':
    'Suggerimenti di comandi',
  'textareaComposer.suggestionList.emojiSuggestions.ariaLabel': 'Suggerimenti di emoji',
  'textareaComposer.suggestionList.mentionSuggestions.ariaLabel':
    'Suggerimenti di menzioni',
  'textareaComposer.suggestionList.suggestions.ariaLabel': 'Suggerimenti',
  'textareaComposer.textareaPlaceholder.searchGiFs.label': 'Cerca GIF',
  'textareaComposer.textareaPlaceholder.sendMessage.label': 'Scrivi un messaggio',
  'textareaComposer.textareaPlaceholder.slowModeWaitS.label':
    'Modalità lenta, attendi {{ seconds }}s...',
  'thread.header.closeThread.ariaLabel': 'Chiudi thread',
  'thread.header.thread.text': 'Thread',
  'threadList.chat.ariaLabel': 'Chat: {{ channelName }}',
  'threadList.empty.text': 'Rispondi a un messaggio per iniziare un thread',
  'threadList.thread.ariaLabel': 'Thread: {{ messagePreview }}',
  'threadList.threadList.ariaLabel': 'Elenco dei thread',
  'threadList.unseenBanner.loading': 'Caricamento...',
  'threadList.unseenBanner.unreadThreads_one': '{{ count }} thread non letto',
  'threadList.unseenBanner.unreadThreads_other': '{{ count }} thread non letti',
  'typing.manyUsers_one': '{{ count }} persona sta scrivendo',
  'typing.manyUsers_other': '{{ count }} persone stanno scrivendo',
  'typing.singleUser': '{{ typing }} sta scrivendo',
  'typing.twoUsers': '{{ typing }} stanno scrivendo',
  'videoPlayer.videoThumbnail.playVideo.ariaLabel': 'Riproduci video',
  'timestamp.ChannelDetailPinnedMessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Ieri]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.ChannelPreviewTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Ieri]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.DateSeparator':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Oggi]", "nextDay": "[Domani]", "lastDay": "[Ieri]", "nextWeek": "dddd", "lastWeek": "[Lo scorso] dddd", "sameElse": "ddd D MMM" }) }}',
  'timestamp.ReminderNotification':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Oggi] [alle] HH:mm", "nextDay": "[Domani] [alle] HH:mm", "lastDay": "[Ieri] [alle] HH:mm", "nextWeek": "dddd [alle] HH:mm", "lastWeek": "[Lo scorso] dddd [alle] HH:mm", "sameElse": "ddd D MMM [alle] HH:mm" }) }}',
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
type Untranslated = Exclude<TranslatableKey, keyof typeof itTranslations>;
type AssertNoneMissing<T extends never> = T;
export type ItalianIsComplete = AssertNoneMissing<Untranslated>;

/**
 * Calendar wording for the keys that format against the locale's own calendar —
 * `timestamp.LiveLocation` and `timestamp.PollVoteTooltip`. Passed as the third argument to
 * `registerTranslation`, which is how a shared instance carries one config per language.
 */
export const itDayjsLocaleConfig = {
  calendar: {
    lastDay: '[ieri alle] LT',
    lastWeek: '[lo scorso] dddd [alle] LT',
    nextDay: '[domani alle] LT',
    nextWeek: 'dddd [alle] LT',
    sameDay: '[oggi alle] LT',
    sameElse: 'L',
  },
};
