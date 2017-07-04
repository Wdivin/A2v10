#pragma once

struct RENDER_INFO;
class CFormItem;
class CXamlEditView;

class CA2FormDocument : public CDocument
{
protected: // create from serialization only
	CA2FormDocument();
	DECLARE_DYNCREATE(CA2FormDocument)

	CFormItem* m_pRoot;
public:
	virtual ~CA2FormDocument();

	void DrawContent(const RENDER_INFO& ri);

	bool IsLocked() const;

	virtual BOOL OnNewDocument() override;
	virtual void OnCloseDocument() override;
	virtual BOOL OnOpenDocument(LPCTSTR lpszPathName) override;
	virtual BOOL OnSaveDocument(LPCTSTR lpszPathName) override;
	virtual BOOL CanCloseFrame(CFrameWnd* pFrame) override;
	virtual void Serialize(CArchive& ar) override;
	virtual void SetModifiedFlag(BOOL bModified = TRUE) override;
#ifdef SHARED_HANDLERS
	virtual void InitializeSearchContent();
	virtual void OnDrawThumbnail(CDC& dc, LPRECT lprcBounds);
#endif // SHARED_HANDLERS

protected:
	void DrawSelection(const RENDER_INFO& ri);
	void CreateRootElement();
	void Clear();
	CXamlEditView* GetXamlEditView();
	void ParseXml(LPCWSTR szXml);

	DECLARE_MESSAGE_MAP()

#ifdef SHARED_HANDLERS
	// Helper function that sets search content for a Search Handler
	void SetSearchContent(const CString& value);
#endif // SHARED_HANDLERS
};

