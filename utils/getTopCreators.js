export const getCreators = (nfts) => {
  const nftsData = {};
  const result = [];

  nfts.forEach((nft) => {
    if (!nftsData[nft.seller]) {
      nftsData[nft.seller] = parseInt(nft.price);
    } else {
      nftsData[nft.seller] += parseInt(nft.price);
    }
  });

  for (const nft in nftsData) {
    result.push({ seller: nft, sum: nftsData[nft] });
  }

  return result;
};
