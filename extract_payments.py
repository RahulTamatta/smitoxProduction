import re
import csv
import sys

def parse_chat(file_path):
    # Regex to identify the start of a new message
    # Format: 03/10/24, 1:06 pm - 
    # Adjust regex if the format varies slightly (e.g. 2-digit vs 4-digit year)
    message_start_pattern = re.compile(r'^(\d{2}/\d{2}/\d{2}), (\d{1,2}:\d{2}\s?[ap]m) - (.*?): (.*)$', re.IGNORECASE)
    
    # regex for system messages like "Messages and calls are end-to-end encrypted"
    system_message_pattern = re.compile(r'^(\d{2}/\d{2}/\d{2}), (\d{1,2}:\d{2}\s?[ap]m) - (.*)$', re.IGNORECASE)

    messages = []
    current_message = None

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            match = message_start_pattern.match(line)
            if match:
                # Save the previous message if it exists
                if current_message:
                    messages.append(current_message)
                
                # Start a new message
                date, time, sender, content = match.groups()
                current_message = {
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'content': content
                }
            else:
                # Check for "system" messages that usually don't have a sender like "Rahul:"
                # But sometimes "Rahul:" is missing in the regex if it matched system pattern?
                # Actually, standard whatsapp export is "Date, Time - Sender: Message"
                # System messages are "Date, Time - Message"
                
                sys_match = system_message_pattern.match(line)
                if sys_match:
                     # It's a system message or a message start that failed the first regex
                     # If it's a valid message start but just parsed as system, we might ignore or handle it.
                     # For extraction purposes, usually we care about user messages.
                     if current_message:
                        messages.append(current_message)
                        current_message = None # Reset
                else:
                    # Continuation of the previous message
                    if current_message:
                        current_message['content'] += "\n" + line

    if current_message:
        messages.append(current_message)

    return messages

def extract_payment_info(messages):
    # Keywords to search for
    keywords = [
        r'payment', r'paid', r'pay', r'transfer', r'transaction', r'amount',
        r'rupees', r'rs\.?', r'INR', r'₹',
        r'\d+k', # e.g. 2k, 3k
        r'\d{3,}' # numbers with 3 or more digits might be amounts, but this is noisy
    ]
    
    # Combine keywords into a single regex for efficiency, word boundaries for some
    # We want to be a bit loose to catch "gpay", "phonepe", etc.
    
    payment_messages = []
    
    for msg in messages:
        content = msg['content'].lower()
        
        # Check for strong keywords
        if any(re.search(k, content) for k in keywords):
            payment_messages.append(msg)

    return payment_messages

def search_chat(messages, query):
    search_results = []
    query = query.lower()
    
    for msg in messages:
        if query in msg['content'].lower() or query in msg['sender'].lower():
            search_results.append(msg)
    
    return search_results

def print_and_save_results(results, output_csv, title):
    print(f"\nFound {len(results)} {title}.")
    print("-" * 50)
    print(f"{'Date':<10} | {'Sender':<25} | {'Message'}")
    print("-" * 50)
    
    for msg in results:
        # Truncate long messages for display
        display_content = (msg['content'][:75] + '...') if len(msg['content']) > 75 else msg['content']
        display_content = display_content.replace('\n', ' ')
        print(f"{msg['date']:<10} | {msg['sender']:<25} | {display_content}")
        
    with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'time', 'sender', 'content']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for msg in results:
            writer.writerow(msg)
    print("-" * 50)
    print(f"Results saved to {output_csv}")

def main():
    chat_file = "WhatsApp Chat with Rahul.txt"
    try:
        print(f"Reading chat from: {chat_file}")
        all_messages = parse_chat(chat_file)
        print(f"Total messages parsed: {len(all_messages)}")
        
        print("\nWhat would you like to do?")
        print("1. Extract Payment Information")
        print("2. Search for a specific term")
        
        choice = input("Enter your choice (1 or 2): ").strip()
        
        if choice == '1':
            results = extract_payment_info(all_messages)
            print_and_save_results(results, "payment_info_extracted.csv", "payment-related messages")
            
        elif choice == '2':
            query = input("Enter search term: ").strip()
            if not query:
                print("Error: Search term cannot be empty.")
                return
            
            results = search_chat(all_messages, query)
            filename = f"search_results_{re.sub(r'[^a-zA-Z0-9]', '_', query)}.csv"
            print_and_save_results(results, filename, f"messages matching '{query}'")
            
        else:
            print("Invalid choice. Please run the script again and select 1 or 2.")

    except FileNotFoundError:
        print(f"Error: File '{chat_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
