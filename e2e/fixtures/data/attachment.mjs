/* eslint-disable sort-keys */
const smallImageAttachment = [
  {
    type: 'image',
    fallback: 'jake-colling-QNISDWH4wCc-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/5fa5f7e2-ccaa-460b-8204-ca9dd1298cab.jake-colling-QNISDWH4wCc-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzVmYTVmN2UyLWNjYWEtNDYwYi04MjA0LWNhOWRkMTI5OGNhYi5qYWtlLWNvbGxpbmctUU5JU0RXSDR3Q2MtdW5zcGxhc2guanBnPypvaD0xODAqb3c9MjQwKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY2Mzc2NDc3M319fV19&Signature=Yt6M9~dVsqW1SuUAx0YyW2VE1dKYtXnrwnxZ91Y13Erck22DqQC5uvetZ2vN30P~yXAtEUan0nP9kYJucRbTiJpbHhzw7hfMohS2fGlTygh5wDugKxajFuk0cx~4mNj-Ufhs2NImkDiNwDY5azmMJt1wpOkZMDyujuEHmWQ-WsjPKaXaeUzKmA-YJB~eLA9AZl3Bshqj86CBYL5uUnHcOGH5ViF9xHgGvTrMtCLeIOkfbefjQibjBYv7bbhjun-b52efS9ZeoHUSqOkiu8TXlTG9wAEk4Zsp18OxUqUxfYHH44dSwHuhHcVtQtcNONtqQEuU~n4~kAcafMRy~7K5dw__&oh=180&ow=240',
    original_width: 240,
    original_height: 180,
  },
];

const imageAttachment = [
  {
    type: 'image',
    fallback: 'brooke-lark-jUPOXXRNdcA-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/74b15215-ed17-420f-8aea-fc5655d2c84a.brooke-lark-jUPOXXRNdcA-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzc0YjE1MjE1LWVkMTctNDIwZi04YWVhLWZjNTY1NWQyYzg0YS5icm9va2UtbGFyay1qVVBPWFhSTmRjQS11bnNwbGFzaC5qcGc~Km9oPTM3NDUqb3c9NTUwMyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjQ5NDJ9fX1dfQ__&Signature=HpMpjoVBDzA8Bh47EYX6YymnGM7ocCCkqxtoehWnrB~2EbZ1LGjqUro4sidM7j2pmKaIDbXOEVSnucNqcDVPC-hs4D-htDh-~Ca-r67oCdFqpp7OU1jjvuH2lpOMne26-2Q1EcaJMRIWTA9Gr2Plepp5h8-QEqZpij~nJ4PNa~0b13VS2eaWhPPPXrTrHac-mJwc2HcPzEXM37UFtEc~LUKw1Hoc-XF86~-7vj~btVHTRc7fwtQwvgFWXwM1WU4FJ74d-DzChgzLCc5h4prPmJqF51unRVTnLBnnPES-YWOcQfC6wSPFHJnvWPGAbY-LJ0ydr-lAKcM9SREBzKw-oA__&oh=3745&ow=5503',
    original_width: 5503,
    original_height: 3745,
  },
];

const svgImageAttachment = [
  {
    type: 'image',
    fallback: 'STREAM MARK 1.svg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/2ed729b1-f4c6-4c90-bb44-5314711a6e3a.STREAM%20MARK%201.svg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzJlZDcyOWIxLWY0YzYtNGM5MC1iYjQ0LTUzMTQ3MTFhNmUzYS5TVFJFQU0lMjBNQVJLJTIwMS5zdmc~Km9oPTEqb3c9MSoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjQ5OTJ9fX1dfQ__&Signature=I3~A-K7EtuYEckM1~DUDgZ8hEqtLxIqHqh27R2DuGAxlwl7gGGgijj56ENHDoIxdVo0oqbEnNwks~d4Tgj~HcEQgz0dZEZLQzwxxFnwM2capLrVR7JuPpdWi~4qNNVuv6ILSZ-pnsyiqBfj6UqzojMMGTuSJZBePggX8MuzjAzttH0epMlHkEF0NTFXWGgDtPZd~yJm5XjRikLeI26xZ9MIa-Bw-AaXIk3yz-ZB1kbXiI~23q1jCVTb6SooUrmtYG0BS6L-74yJCHO~YG2epkIO~4fgnMtcXW20809cWFLd0sTM6w2kWvJn6PjiJ4S4SIXZ-uNmD42Wzp7Tzki85gw__&oh=1&ow=1',
    original_width: 1,
    original_height: 1,
  },
];

const galleryAttachment = [
  {
    type: 'image',
    fallback: 'brooke-lark-nBtmglfY0HU-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/2d072694-a6be-4310-a61b-6eb08a165cec.brooke-lark-nBtmglfY0HU-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzJkMDcyNjk0LWE2YmUtNDMxMC1hNjFiLTZlYjA4YTE2NWNlYy5icm9va2UtbGFyay1uQnRtZ2xmWTBIVS11bnNwbGFzaC5qcGc~Km9oPTU3NjAqb3c9Mzg0MCoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjUwNTV9fX1dfQ__&Signature=oHwhiRUHW8w3fSYUW8RDBN9lmM9GiM1GNEHgdWQ-rLAj1JD2RLIo5xvOqlx1SGheBhvJweEj94TltdGJMmc3Ar3JUwYYahfNmTQAvKoUSzR88C23EPCphEoCteiUyeeBgaUBi7FkwgHZUYQmPIwzswxrVTzN7-rvY6BxQgPKXeOn9MWuE1a3RO6KlMrqgYs1WV7HRKUsuyFdLGxBeBRfkJB3pTyDWqRDsJSN9RqLXfa9FggurDSSkT7ep0813S66iatMVLajr5aSygm69-hv6oVlHcIbtEGUQ9iwy~TPrGHpiaYf7DoNRpeXMiPt48DbgzxRmwfBPdIm4j7Se3aTeA__&oh=5760&ow=3840',
    original_width: 3840,
    original_height: 5760,
  },
  {
    type: 'image',
    fallback: 'brooke-lark--F_5g8EEHYE-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/befa6c23-a36a-4e43-bd4f-c87e8d664cf9.brooke-lark--F_5g8EEHYE-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzL2JlZmE2YzIzLWEzNmEtNGU0My1iZDRmLWM4N2U4ZDY2NGNmOS5icm9va2UtbGFyay0tRl81ZzhFRUhZRS11bnNwbGFzaC5qcGc~Km9oPTU3MTEqb3c9Mzg0MCoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjUwNTV9fX1dfQ__&Signature=Mc10MG2NyTMSkLoXvNSGdBb46z-LyCCbRFZdSmSd1FDU5s9TSQf5Fkk~VdspLU3KmqKi0z-i~3ZzgCwcZJ0wJQaLhvkO8vvls90Kv-T5KplYa7d-Po~vTHVLzT0b9rseqBaxVTS6MoLeRw~7Fn3Ac~SVSRPyB1Q4n8avvzXU22w7x4uIHb250rSZt0jp8gzWjR5yv3jFqEqWrctRAaGbeGSzm54ATWV~GNpBrT6~aoMSEpw~mQNYS1plM6klRztCmZ3q-ihVcUVZ1G2w5MvhUTrgeY320~pZmcIDBFwocbdEu8YpmBXaVmsf0RiHzTw2uwXSgCJSNPnz~hG5ewVZ-w__&oh=5711&ow=3840',
    original_width: 3840,
    original_height: 5711,
  },
  {
    type: 'image',
    fallback: 'rachel-park-hrlvr2ZlUNk-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/56b257af-641c-4b6d-982c-49de51105fd4.rachel-park-hrlvr2ZlUNk-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzU2YjI1N2FmLTY0MWMtNGI2ZC05ODJjLTQ5ZGU1MTEwNWZkNC5yYWNoZWwtcGFyay1ocmx2cjJabFVOay11bnNwbGFzaC5qcGc~Km9oPTQwMDAqb3c9NjAwMCoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjUwNTV9fX1dfQ__&Signature=Ai0RERtsn8X-Z7IFGTCjGv9VSGSf2b--l8ZSd03T6tLc9hZWEERSpmOLOGodBTj4mow0ep4a59KB9mT8uYye9NOTS8HCufh9fNUVxU7fcwiFLbs8z2RVc4Z9RIdmj0ggIApphYBJqMdj2UvODB655ZduU~wtRgIwb6EXu5mydeyieqsmVm9VAzbHWkJKwuEsfp87IPxYNAa4JwvFdFTsiG-NVGrUz5M~TcpSy5qMSe3z0x~28JGThiyfoM3R142aNBlcoA82HsNMohSdvaqwzsb~hpOvDNzpN8MAESDs0r7zCrlPsQmKb66cRYK2wOEIj7-ZIWTOsr4L54~U~A3d5A__&oh=4000&ow=6000',
    original_width: 6000,
    original_height: 4000,
  },
  {
    type: 'image',
    fallback: 'joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/6f88e637-a879-417b-8730-ea8eb168ede4.joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzZmODhlNjM3LWE4NzktNDE3Yi04NzMwLWVhOGViMTY4ZWRlNC5qb3NlcGgtZ29uemFsZXotemNVZ2p5cUV3ZTgtdW5zcGxhc2guanBnPypvaD0yMDAwKm93PTE1NDcqIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjYzNzY1MDU1fX19XX0_&Signature=InLIOzglgz1VL5sD7cRZNI8-Cz7pAWyAKx2XldHzm1Xs8rmPL3zCjV961~eg059oMxsqYdm4-t9tVTBKj2TtygJuhoGBn5CkcBEOTfok-EnNGzZJBW1JUdps~~GGapFOWvOrD0U4jyEpNjSQyPG5xlL4JIsDPMQYSIEDI85Is07IduUQezmpodkT58qJZrNrNckAoZi3aKSIs3sPkAEemKVFXxxmVHvZd6n-VbRQ9lFGvaLE~qYfFmFu4-NUGSsZMBGNSrU2t0VlY40EUgEf67jQx~F8Uhi878OWSMdla47iZyzjcrrEKPE8GbRm4YCst1cgqd2cLEYeD2cz51noMA__&oh=2000&ow=1547',
    original_width: 1547,
    original_height: 2000,
  },
  {
    type: 'image',
    fallback: 'rachel-park-hrlvr2ZlUNk-unsplash.jpg',
    image_url:
      'https://us-east.stream-io-cdn.com/1143119/images/56b257af-641c-4b6d-982c-49de51105fd4.rachel-park-hrlvr2ZlUNk-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzU2YjI1N2FmLTY0MWMtNGI2ZC05ODJjLTQ5ZGU1MTEwNWZkNC5yYWNoZWwtcGFyay1ocmx2cjJabFVOay11bnNwbGFzaC5qcGc~Km9oPTQwMDAqb3c9NjAwMCoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjUwNTV9fX1dfQ__&Signature=Ai0RERtsn8X-Z7IFGTCjGv9VSGSf2b--l8ZSd03T6tLc9hZWEERSpmOLOGodBTj4mow0ep4a59KB9mT8uYye9NOTS8HCufh9fNUVxU7fcwiFLbs8z2RVc4Z9RIdmj0ggIApphYBJqMdj2UvODB655ZduU~wtRgIwb6EXu5mydeyieqsmVm9VAzbHWkJKwuEsfp87IPxYNAa4JwvFdFTsiG-NVGrUz5M~TcpSy5qMSe3z0x~28JGThiyfoM3R142aNBlcoA82HsNMohSdvaqwzsb~hpOvDNzpN8MAESDs0r7zCrlPsQmKb66cRYK2wOEIj7-ZIWTOsr4L54~U~A3d5A__&oh=4000&ow=6000',
    original_width: 6000,
    original_height: 4000,
  },
];

const videoAttachment = [
  {
    type: 'video',
    title: 'longlonglonglongname.MOV',
    asset_url:
      'https://us-east.stream-io-cdn.com/1143119/attachments/30d882b9-1da0-4ff1-b6ee-403c5ee500c1.longlonglonglongname.MOV?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvYXR0YWNobWVudHMvMzBkODgyYjktMWRhMC00ZmYxLWI2ZWUtNDAzYzVlZTUwMGMxLmxvbmdsb25nbG9uZ2xvbmduYW1lLk1PVioiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM3NjUxNTl9fX1dfQ__&Signature=EYMu8WQGIIpj4Vkqw54TAVk~gmMr0U3wXHoQRvdV~oFq3wCPS6E5SfMHj9jvZl6xKZySLalHiYwRbeEQcs4YbSgpbYZwQY54Svld4-WcxYOLxG3QsPrl5oHIG8gZP1E5eqWiS395HEjkMPaBsLSPGLXL0ds2AHX1Ez-oxgObXbzOd~9cb8r~A8z~wgD~ZyK6EDPABmIjbw1bTLoAvEQLXLo81yyxbneHt3yzdMwcHA-nf~dKpZmfJQij4XkCBC470RuWRXYYS2XO4s4OF1R4wQ8HWyYclouGXCOHS3jjYVXBGebV7rssMCqMoCKWjNRTrYaZDTg3ZYstgfF8r-CpsA__',
    file_size: 10115279,
    mime_type: 'video/quicktime',
  },
];

export const sampleAttachments = [
  imageAttachment,
  smallImageAttachment,
  svgImageAttachment,
  galleryAttachment,
  videoAttachment,
];
